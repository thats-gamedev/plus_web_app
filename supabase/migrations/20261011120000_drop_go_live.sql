-- Content attached to a drop goes live with the drop.
--
-- The admin can publish a list or e-book weeks ahead and attach it to a
-- planned drop: it stays hidden (member library, landing page, public teasers,
-- sitemap) until the drop's go-live time. A published resource in a drop takes
-- the drop's published_at, kept in sync by the triggers below, and every read
-- requires published_at <= now(). "New" badges and "Recently added" then also
-- count from the go-live day.

-- 1. A drop's resources follow its go-live time.
create function public.resources_follow_drop()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.drop_id is not null then
    new.published_at := (select d.published_at from public.drops d where d.id = new.drop_id);
  elsif new.status = 'published' and tg_op = 'UPDATE' and old.drop_id is not null and new.drop_id is null
    and (new.published_at is null or new.published_at > now()) then
    -- Taken out of a planned drop: live right away, like any other content.
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger resources_follow_drop
  before insert or update of status, drop_id, published_at on public.resources
  for each row execute function public.resources_follow_drop();

create function public.drop_moves_resources()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.resources
     set published_at = new.published_at
   where drop_id = new.id
     and status = 'published'
     and published_at is distinct from new.published_at;
  return null;
end;
$$;

create trigger drop_moves_resources
  after update of published_at on public.drops
  for each row execute function public.drop_moves_resources();

-- Bring existing rows in line.
update public.resources r
   set published_at = d.published_at
  from public.drops d
 where r.drop_id = d.id
   and r.status = 'published'
   and r.published_at is distinct from d.published_at;

-- 2. Members only read resources whose go-live time has passed.
drop policy "resources: members read published, admins read all" on public.resources;

create policy "resources: members read live, admins read all"
  on public.resources for select to authenticated
  using (
    (status = 'published' and published_at <= now() and (select public.is_plus((select auth.uid()))))
    or (select public.is_admin((select auth.uid())))
  );

-- 3. The public teaser views: same rule (they bypass RLS on purpose).
create or replace view public.public_teaser_resources as
select
  r.slug,
  r.title,
  r.summary,
  r.type,
  r.list_kind,
  r.category,
  r.cover_path,
  jsonb_array_length(jsonb_path_query_array(r.content, '$.sections[*].items[*]')) as item_count
from public.resources r
where r.type = 'list'
  and r.status = 'published'
  and r.published_at <= now()
  and jsonb_path_exists(r.content, '$.sections[*].items[*] ? (@.isTeaser == true)');

create or replace view public.public_teaser_items as
select
  r.slug as resource_slug,
  r.list_kind,
  sec.value ->> 'title' as section_title,
  row_number() over (partition by r.id order by sec.ord, itm.ord)::integer as position,
  itm.value as item
from public.resources r
cross join lateral jsonb_array_elements(r.content -> 'sections') with ordinality as sec (value, ord)
cross join lateral jsonb_array_elements(sec.value -> 'items') with ordinality as itm (value, ord)
where r.type = 'list'
  and r.status = 'published'
  and r.published_at <= now()
  and jsonb_path_exists(itm.value, '$ ? (@.isTeaser == true)');
