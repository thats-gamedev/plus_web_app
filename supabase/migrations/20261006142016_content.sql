-- Monthly drops and the resource library (lists, e-books, guides).

create table public.drops (
  id uuid primary key default gen_random_uuid(),
  month date not null unique check (extract(day from month) = 1),
  title text not null,
  theme text,
  intro_md text,
  -- Go-live time; members see the drop once this is in the past.
  published_at timestamptz,
  -- Set when the announcement email went out, so it is sent only once.
  announced_at timestamptz,
  created_at timestamptz not null default now()
);

create type public.resource_type as enum ('list', 'ebook', 'guide');
create type public.list_kind as enum ('tools', 'assets', 'creators', 'prompts');
create type public.resource_category as enum ('gamedev', '3d', 'business', 'ai');
create type public.resource_status as enum ('draft', 'published');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  type public.resource_type not null,
  list_kind public.list_kind,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '',
  category public.resource_category not null,
  cover_path text,
  body_md text,
  file_path text,
  -- List document (lib/lists/schema.ts); Zod validates it before every save.
  content jsonb,
  draft_content jsonb,
  draft_updated_at timestamptz,
  drop_id uuid references public.drops (id) on delete set null,
  status public.resource_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint resources_list_kind_matches_type
    check ((type = 'list') = (list_kind is not null)),
  constraint resources_content_only_for_lists
    check (type = 'list' or (content is null and draft_content is null)),
  constraint resources_content_kind
    check (content is null or content ->> 'kind' = list_kind::text),
  constraint resources_draft_content_kind
    check (draft_content is null or draft_content ->> 'kind' = list_kind::text),
  constraint resources_content_size
    check (content is null or octet_length(content::text) < 524288),
  constraint resources_draft_content_size
    check (draft_content is null or octet_length(draft_content::text) < 524288),
  constraint resources_published_has_date
    check (status = 'draft' or published_at is not null)
);

create index resources_drop_id_idx on public.resources (drop_id);
create index resources_status_published_at_idx on public.resources (status, published_at desc);

create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();
