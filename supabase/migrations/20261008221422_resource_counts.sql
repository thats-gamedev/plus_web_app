-- Derived counts for library cards ("25 items", "12 min read"), so listing
-- pages never load the full list documents or Markdown bodies.
--   item_count  items across all sections of a published list document
--   word_count  words in body_md (guides, e-book descriptions)

alter table public.resources
  add column item_count integer generated always as (
    case when content is null then null
    else jsonb_array_length(jsonb_path_query_array(content, '$.sections[*].items[*]')) end
  ) stored,
  add column word_count integer generated always as (
    case when body_md is null then null else regexp_count(body_md, '\w+') end
  ) stored;

-- Members select resources by explicit column list (see the rls migration).
grant select (item_count, word_count) on public.resources to authenticated;
