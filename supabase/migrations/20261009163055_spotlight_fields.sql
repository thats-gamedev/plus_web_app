-- Extra Spotlight fields from the mockup (MW10): project type, engine,
-- project link and credits on several platforms.
alter table public.spotlight_submissions
  add column project_type text check (project_type in ('game', '3d_art', 'animation', 'tool', 'other')),
  add column engine text check (char_length(engine) <= 40),
  add column project_url text check (project_url ~ '^https?://' and char_length(project_url) <= 500),
  -- [{ "platform": "instagram", "handle": "mara.makes" }, …]
  add column credits jsonb not null default '[]'::jsonb
    check (jsonb_typeof(credits) = 'array' and jsonb_array_length(credits) <= 6);

alter table public.spotlight_submissions
  add constraint spotlight_video_url_http check (video_url is null or (video_url ~ '^https?://' and char_length(video_url) <= 500));

-- Members insert by explicit column list (see the rls migration).
grant insert (project_type, engine, project_url, credits) on public.spotlight_submissions to authenticated;
