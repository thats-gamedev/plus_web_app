-- Development seed data. Idempotent: safe to run again on the hosted dev
-- project (on conflict do nothing / fixed ids). Never run against production.
--
-- Users (password for all three: dev-password-123)
--   admin@example.com    role admin, no subscription
--   member@example.com   Plus member (subscription active)
--   visitor@example.com  account without a subscription

-- Users ---------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('dev-password-123', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', jsonb_build_object('display_name', u.name),
  now(), now(), '', '', '', '', '', '', '', ''
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'admin@example.com', 'Dev Admin'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'member@example.com', 'Dev Member'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'visitor@example.com', 'Dev Visitor')
) as u (id, email, name)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003'
)
on conflict (provider_id, provider) do nothing;

-- The sign-up trigger created the profiles; promote the admin.
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000001';

insert into public.subscriptions (
  user_id, stripe_subscription_id, stripe_price_id, plan, status,
  cancel_at_period_end, current_period_end, created_at
)
values (
  '00000000-0000-4000-8000-000000000002', 'sub_seed_member', 'price_seed_founding_monthly',
  'founding_monthly', 'active', false, now() + interval '30 days', now() - interval '3 days'
)
on conflict (stripe_subscription_id) do nothing;

insert into public.webhook_events (stripe_event_id, event_type, payload, processed_at)
values (
  'evt_seed_1', 'customer.subscription.created',
  '{"id": "evt_seed_1", "type": "customer.subscription.created", "data": {"object": {"id": "sub_seed_member"}}}',
  now()
)
on conflict (stripe_event_id) do nothing;

-- October drop ----------------------------------------------------------------
insert into public.drops (id, month, title, theme, intro_md, published_at)
values (
  '10000000-0000-4000-8000-000000000001', '2026-10-01', 'The texturing drop', 'Texturing',
  'This month is all about **texturing**: the tools we use, free assets to practise on, creators who explain it best and prompts for quick concept sheets.',
  '2026-10-01T08:00:00Z'
)
on conflict (month) do nothing;

-- Resources -------------------------------------------------------------------
insert into public.resources (
  id, type, list_kind, slug, title, summary, category, status, published_at, drop_id, content
)
values
(
  '20000000-0000-4000-8000-000000000001', 'list', 'tools', 'texturing-tools',
  'Texturing tools', 'The software we reach for when texturing game assets.', '3d',
  'published', '2026-10-01T08:00:00Z', '10000000-0000-4000-8000-000000000001',
  $json${
    "schemaVersion": 1,
    "kind": "tools",
    "intro": "Start with one painter and one baker; add the rest when you need them.",
    "sections": [
      {
        "id": "sec_tools_paint",
        "title": "Painting",
        "items": [
          {
            "id": "itm_tools_01", "name": "Substance 3D Painter", "url": "https://www.adobe.com/products/substance3d/apps/painter.html",
            "why": "Industry standard for PBR texturing; worth learning early.",
            "tags": ["texturing", "pbr"], "isAffiliate": false, "isTeaser": true, "addedAt": "2026-10-01",
            "pricing": "subscription", "priceNote": "Free for students", "platforms": ["windows", "mac"]
          },
          {
            "id": "itm_tools_02", "name": "ArmorPaint", "url": "https://armorpaint.org",
            "why": "Cheap, fast PBR painter that runs on almost anything.",
            "tags": ["texturing", "pbr"], "isAffiliate": false, "isTeaser": false, "addedAt": "2026-10-01",
            "pricing": "one_time", "platforms": ["windows", "mac", "linux"]
          }
        ]
      },
      {
        "id": "sec_tools_bake",
        "title": "Baking",
        "description": "High-to-low poly bakes.",
        "items": [
          {
            "id": "itm_tools_03", "name": "Marmoset Toolbag", "url": "https://marmoset.co/toolbag",
            "why": "The cleanest bakes and the best portfolio renders.",
            "tags": ["baking", "rendering"], "isAffiliate": true, "isTeaser": true, "addedAt": "2026-09-20",
            "pricing": "subscription", "platforms": ["windows", "mac"]
          }
        ]
      }
    ]
  }$json$::jsonb
),
(
  '20000000-0000-4000-8000-000000000002', 'list', 'assets', 'free-texture-libraries',
  'Free texture libraries', 'CC0 and royalty-free materials to practise and prototype with.', '3d',
  'published', '2026-10-01T08:00:00Z', '10000000-0000-4000-8000-000000000001',
  $json${
    "schemaVersion": 1,
    "kind": "assets",
    "sections": [
      {
        "id": "sec_assets_01",
        "title": "Materials",
        "items": [
          {
            "id": "itm_assets_01", "name": "Poly Haven Textures", "url": "https://polyhaven.com/textures",
            "why": "High-quality scanned materials, all CC0.",
            "tags": ["pbr", "scanned"], "isAffiliate": false, "isTeaser": true, "addedAt": "2026-10-01",
            "source": "Poly Haven", "price": { "amount": 0, "currency": "USD" }, "license": "cc0",
            "engines": ["any"], "formats": ["png", "exr"]
          },
          {
            "id": "itm_assets_02", "name": "Stylized Nature Pack", "url": "https://assetstore.unity.com",
            "why": "Cohesive style, works out of the box in URP.",
            "tags": ["environment", "stylized"], "isAffiliate": true, "isTeaser": false, "addedAt": "2026-09-28",
            "source": "Unity Asset Store", "price": { "amount": 29.99, "currency": "USD" }, "license": "royalty_free",
            "engines": ["unity"], "formats": ["fbx", "png"]
          }
        ]
      }
    ]
  }$json$::jsonb
),
(
  '20000000-0000-4000-8000-000000000003', 'list', 'creators', 'texturing-creators',
  'Creators who teach texturing', 'People who explain texturing clearly, across platforms.', '3d',
  'published', '2026-10-01T08:00:00Z', '10000000-0000-4000-8000-000000000001',
  $json${
    "schemaVersion": 1,
    "kind": "creators",
    "sections": [
      {
        "id": "sec_creators_01",
        "title": "Start here",
        "items": [
          {
            "id": "itm_creators_01", "name": "Example Creator", "url": "https://youtube.com/@example",
            "why": "Short, practical texturing breakdowns; great process posts on Instagram too.",
            "tags": ["texturing", "substance"], "isAffiliate": false, "isTeaser": true, "addedAt": "2026-10-01",
            "focus": "3d", "level": "beginner", "language": "en", "primaryPlatform": "youtube",
            "links": [
              { "platform": "youtube", "url": "https://youtube.com/@example", "handle": "@example" },
              { "platform": "instagram", "url": "https://instagram.com/example", "handle": "@example" },
              { "platform": "artstation", "url": "https://artstation.com/example" }
            ],
            "startHereUrl": "https://youtube.com/watch?v=example"
          },
          {
            "id": "itm_creators_02", "name": "Another Artist", "url": "https://artstation.com/another",
            "why": "Hand-painted textures with full process breakdowns.",
            "tags": ["hand-painted"], "isAffiliate": false, "isTeaser": false, "addedAt": "2026-09-15",
            "focus": "gamedev", "level": "intermediate", "language": "en", "primaryPlatform": "artstation",
            "links": [
              { "platform": "artstation", "url": "https://artstation.com/another" },
              { "platform": "x", "url": "https://x.com/another", "handle": "@another" }
            ]
          }
        ]
      }
    ]
  }$json$::jsonb
),
(
  '20000000-0000-4000-8000-000000000004', 'list', 'prompts', 'concept-art-prompts',
  'Concept art prompts', 'Prompts for quick prop and character concept sheets.', 'ai',
  'published', '2026-10-01T08:00:00Z', '10000000-0000-4000-8000-000000000001',
  $json${
    "schemaVersion": 1,
    "kind": "prompts",
    "intro": "Fill in the fields, copy the prompt and paste it into your image tool.",
    "sections": [
      {
        "id": "sec_prompts_01",
        "title": "Props",
        "items": [
          {
            "id": "itm_prompts_01", "name": "Stylized prop concept sheet",
            "why": "Gets usable turnaround concepts in one pass.",
            "tags": ["concept-art"], "isAffiliate": false, "isTeaser": true, "addedAt": "2026-10-01",
            "tool": "image",
            "prompt": "Concept sheet of a {{prop}} in {{style}} style, front, side and back view, neutral background",
            "variables": [
              { "name": "prop", "hint": "e.g. treasure chest" },
              { "name": "style", "hint": "e.g. hand-painted fantasy" }
            ]
          },
          {
            "id": "itm_prompts_02", "name": "Texture breakdown helper",
            "why": "Turns a reference photo description into a layer plan for Painter.",
            "isAffiliate": false, "isTeaser": false, "addedAt": "2026-10-01",
            "tool": "chat",
            "prompt": "I want to texture a {{asset}}. List the material layers I need in Substance Painter, from base to wear, with one sentence each.",
            "variables": [{ "name": "asset", "hint": "e.g. rusty oil barrel" }]
          }
        ]
      }
    ]
  }$json$::jsonb
),
-- A draft list: members must never see it, and its draft must stay hidden.
(
  '20000000-0000-4000-8000-000000000005', 'list', 'tools', 'unfinished-tools',
  'Unfinished tools list', 'Still being written.', 'gamedev',
  'draft', null, null, null
)
on conflict (id) do nothing;

update public.resources
set draft_content = $json${
    "schemaVersion": 1,
    "kind": "tools",
    "sections": [{ "id": "sec_draft_01", "title": "General", "items": [] }]
  }$json$::jsonb,
  draft_updated_at = now()
where id = '20000000-0000-4000-8000-000000000005' and draft_content is null;

insert into public.resources (
  id, type, slug, title, summary, category, status, published_at, drop_id, cover_path, file_path, body_md
)
values
(
  '20000000-0000-4000-8000-000000000006', 'ebook', 'texturing-starter-guide',
  'Texturing starter e-book', 'A 40-page PDF from first UVs to portfolio renders.', '3d',
  'published', '2026-10-01T08:00:00Z', '10000000-0000-4000-8000-000000000001',
  null, 'texturing-starter-guide.pdf',
  'What you will learn: UV layout, baking, layering materials and presenting your work.'
),
(
  '20000000-0000-4000-8000-000000000007', 'guide', 'pricing-your-first-commission',
  'Pricing your first commission', 'How to quote freelance 3D work without underselling yourself.', 'business',
  'published', '2026-09-15T08:00:00Z', null, null, null,
  $md$## Start from your day rate

Work out what a day of your time costs, then estimate the days.

## Quote the scope, not the hours

- List exactly what is included.
- Say how many revision rounds are included.
- Name a price for extra rounds up front.
$md$
)
on conflict (id) do nothing;
