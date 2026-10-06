-- Public teaser views: the only way anon reads content.
-- They run with the owner's privileges on purpose (no security_invoker), so
-- they bypass RLS on resources but expose only these columns and only
-- isTeaser items from the published `content`, never `draft_content`.
-- Supabase's linter flags them as security-definer views; that is expected.

create view public.public_teaser_resources as
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
  and jsonb_path_exists(r.content, '$.sections[*].items[*] ? (@.isTeaser == true)');

create view public.public_teaser_items as
select
  r.slug as resource_slug,
  r.list_kind,
  sec.value ->> 'title' as section_title,
  -- Order of the teaser items across the whole list (1-based).
  row_number() over (partition by r.id order by sec.ord, itm.ord)::integer as position,
  itm.value as item
from public.resources r
cross join lateral jsonb_array_elements(r.content -> 'sections') with ordinality as sec (value, ord)
cross join lateral jsonb_array_elements(sec.value -> 'items') with ordinality as itm (value, ord)
where r.type = 'list'
  and r.status = 'published'
  and jsonb_path_exists(itm.value, '$ ? (@.isTeaser == true)');

revoke all on public.public_teaser_resources, public.public_teaser_items from anon, authenticated;
grant select on public.public_teaser_resources, public.public_teaser_items to anon, authenticated;
