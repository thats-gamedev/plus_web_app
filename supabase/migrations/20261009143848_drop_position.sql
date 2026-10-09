-- Order of a drop's content, set by dragging on /admin/drops. Null means
-- "not placed yet": those sort after the placed ones.
alter table public.resources add column drop_position integer check (drop_position >= 0);

create index resources_drop_position_idx on public.resources (drop_id, drop_position);

-- Members select resources by explicit column list (see the rls migration).
grant select (drop_position) on public.resources to authenticated;

-- Existing drops keep their current member-facing order (publish date, title).
update public.resources r
set drop_position = ordered.position
from (
  select id, row_number() over (partition by drop_id order by published_at nulls last, title) - 1 as position
  from public.resources
  where drop_id is not null
) ordered
where r.id = ordered.id;
