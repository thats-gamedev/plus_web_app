import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { beforeAll, describe, expect, it } from "vitest"
import { listDocumentSchema } from "@/lib/lists/schema"
import type { Database } from "@/lib/supabase/database.types"

// RLS tests against the Supabase dev project, using the users from
// supabase/seed.sql. Run with `npm run test:rls`.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local")
}

const PASSWORD = "dev-password-123"
const PERMISSION_DENIED = "42501"

type Client = SupabaseClient<Database>

// Columns members may read; select("*") would include the draft columns.
const RESOURCE_COLUMNS =
  "id, type, list_kind, slug, title, summary, category, cover_path, body_md, file_path, content, drop_id, status, published_at"

function newClient(): Client {
  return createClient<Database>(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signedIn(email: string): Promise<Client> {
  const client = newClient()
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`Sign-in as ${email} failed: ${error.message}. Is the seed applied?`)
  return client
}

let anon: Client
let visitor: Client
let member: Client
let admin: Client

beforeAll(async () => {
  anon = newClient()
  ;[visitor, member, admin] = await Promise.all([
    signedIn("visitor@example.com"),
    signedIn("member@example.com"),
    signedIn("admin@example.com"),
  ])
})

describe("anon", () => {
  it.each([
    "profiles",
    "subscriptions",
    "resources",
    "drops",
    "member_codes",
    "webhook_events",
    "email_log",
    "member_snapshots",
    "spotlight_submissions",
    "cancellation_requests",
  ] as const)("cannot read %s", async (table) => {
    const { data, error } = await anon.from(table).select("*").limit(1)
    expect(data).toBeNull()
    expect(error?.code).toBe(PERMISSION_DENIED)
  })

  it("reads published lists with teaser items from public_teaser_resources", async () => {
    const { data, error } = await anon.from("public_teaser_resources").select("*").order("slug")
    expect(error).toBeNull()
    expect(data?.map((row) => row.slug)).toEqual([
      "concept-art-prompts",
      "free-texture-libraries",
      "texturing-creators",
      "texturing-tools",
    ])
    expect(data?.find((row) => row.slug === "texturing-tools")?.item_count).toBe(3)
    // Only the documented columns are exposed.
    expect(Object.keys(data![0]).sort()).toEqual(
      ["category", "cover_path", "item_count", "list_kind", "slug", "summary", "title", "type"].sort(),
    )
  })

  it("reads only isTeaser items from public_teaser_items", async () => {
    const { data, error } = await anon
      .from("public_teaser_items")
      .select("*")
      .eq("resource_slug", "texturing-tools")
      .order("position")
    expect(error).toBeNull()
    expect(data?.map((row) => [row.position, row.section_title, (row.item as { id: string }).id])).toEqual([
      [1, "Painting", "itm_tools_01"],
      [2, "Baking", "itm_tools_03"],
    ])
  })

  it("never sees draft lists in the teaser views", async () => {
    const { data } = await anon.from("public_teaser_resources").select("slug").eq("slug", "unfinished-tools")
    expect(data).toEqual([])
  })
})

describe("non-member (account without subscription)", () => {
  it("cannot read resources or drops", async () => {
    const resources = await visitor.from("resources").select(RESOURCE_COLUMNS)
    expect(resources.error).toBeNull()
    expect(resources.data).toEqual([])

    const drops = await visitor.from("drops").select("id")
    expect(drops.error).toBeNull()
    expect(drops.data).toEqual([])
  })

  it("reads only its own profile", async () => {
    const { data } = await visitor.from("profiles").select("email")
    expect(data).toEqual([{ email: "visitor@example.com" }])
  })

  it("is not plus", async () => {
    const { data: user } = await visitor.auth.getUser()
    const { data } = await visitor.rpc("is_plus", { uid: user.user!.id })
    expect(data).toBe(false)
  })
})

describe("member", () => {
  it("is plus", async () => {
    const { data: user } = await member.auth.getUser()
    const { data } = await member.rpc("is_plus", { uid: user.user!.id })
    expect(data).toBe(true)
  })

  it("reads published resources, but not drafts", async () => {
    const { data, error } = await member.from("resources").select(RESOURCE_COLUMNS).order("slug")
    expect(error).toBeNull()
    expect(data?.map((row) => row.slug)).toEqual([
      "concept-art-prompts",
      "free-texture-libraries",
      "pricing-your-first-commission",
      "texturing-creators",
      "texturing-starter-guide",
      "texturing-tools",
    ])
  })

  it("gets list content that passes the Zod schema", async () => {
    const { data } = await member.from("resources").select("slug, content").eq("type", "list")
    expect(data).toHaveLength(4)
    for (const row of data!) {
      const result = listDocumentSchema.safeParse(row.content)
      expect(result.error?.issues, row.slug).toBeUndefined()
    }
  })

  it.each(["draft_content", "draft_updated_at", "*"])("cannot select resources.%s", async (column) => {
    const { error } = await member.from("resources").select(column).limit(1)
    expect(error?.code).toBe(PERMISSION_DENIED)
  })

  it("reads the live October drop", async () => {
    const { data } = await member.from("drops").select("month, title")
    expect(data).toEqual([{ month: "2026-10-01", title: "The texturing drop" }])
  })

  it("reads its own subscription only", async () => {
    const { data } = await member.from("subscriptions").select("stripe_subscription_id, status")
    expect(data).toEqual([{ stripe_subscription_id: "sub_seed_member", status: "active" }])
  })

  it("cannot write resources", async () => {
    const { data } = await member
      .from("resources")
      .update({ title: "Hacked" })
      .eq("slug", "texturing-tools")
      .select("title")
    expect(data ?? []).toEqual([])
  })

  it("cannot write subscriptions", async () => {
    const { error } = await member.from("subscriptions").update({ status: "active" }).eq("stripe_subscription_id", "sub_seed_member")
    expect(error?.code).toBe(PERMISSION_DENIED)
  })

  it("cannot read webhook_events", async () => {
    const { data, error } = await member.from("webhook_events").select("id")
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})

describe("profile updates", () => {
  it("cannot change its own role", async () => {
    const { data: user } = await member.auth.getUser()
    const { error } = await member.from("profiles").update({ role: "admin" }).eq("id", user.user!.id)
    expect(error?.code).toBe(PERMISSION_DENIED)

    const { data } = await member.from("profiles").select("role").single()
    expect(data?.role).toBe("member")
  })

  it("cannot change its own stripe_customer_id or email", async () => {
    const { data: user } = await member.auth.getUser()
    for (const patch of [{ stripe_customer_id: "cus_fake" }, { email: "other@example.com" }]) {
      const { error } = await member.from("profiles").update(patch).eq("id", user.user!.id)
      expect(error?.code).toBe(PERMISSION_DENIED)
    }
  })

  it("can change its own display name and drop emails", async () => {
    const { data: user } = await member.auth.getUser()
    const id = user.user!.id
    const changed = await member
      .from("profiles")
      .update({ display_name: "Renamed", drop_emails: false })
      .eq("id", id)
      .select("display_name, drop_emails")
      .single()
    expect(changed.data).toEqual({ display_name: "Renamed", drop_emails: false })

    await member.from("profiles").update({ display_name: "Dev Member", drop_emails: true }).eq("id", id)
  })

  it("cannot change someone else's profile", async () => {
    const { data } = await member
      .from("profiles")
      .update({ display_name: "Hacked" })
      .eq("email", "visitor@example.com")
      .select("id")
    expect(data ?? []).toEqual([])
  })
})

describe("admin", () => {
  it("reads webhook_events", async () => {
    const { data, error } = await admin.from("webhook_events").select("stripe_event_id")
    expect(error).toBeNull()
    expect(data?.map((row) => row.stripe_event_id)).toContain("evt_seed_1")
  })

  it("reads all profiles and draft resources (without draft columns)", async () => {
    const profiles = await admin.from("profiles").select("email")
    expect(profiles.data?.length).toBeGreaterThanOrEqual(3)

    const drafts = await admin.from("resources").select("slug").eq("status", "draft")
    expect(drafts.data?.map((row) => row.slug)).toContain("unfinished-tools")

    const draftContent = await admin.from("resources").select("draft_content").limit(1)
    expect(draftContent.error?.code).toBe(PERMISSION_DENIED)
  })
})

describe("is_plus (database function)", () => {
  // Writes a temporary subscription for the visitor with the secret key, so
  // it needs SUPABASE_SECRET_KEY in .env.local.
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const service = secretKey
    ? createClient<Database>(url!, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null
  const SUB_ID = "sub_rls_test_is_plus"

  it.skipIf(!service).each([
    ["active", true],
    ["trialing", true],
    ["past_due", true],
    ["incomplete", false],
    ["incomplete_expired", false],
    ["unpaid", false],
    ["canceled", false],
    ["paused", false],
  ] as const)("status %s → %s", async (status, expected) => {
    const { data: user } = await visitor.auth.getUser()
    const uid = user.user!.id
    try {
      const { error } = await service!.from("subscriptions").upsert(
        {
          user_id: uid,
          stripe_subscription_id: SUB_ID,
          stripe_price_id: "price_rls_test",
          plan: "founding_monthly",
          status,
          created_at: new Date().toISOString(),
        },
        { onConflict: "stripe_subscription_id" },
      )
      expect(error).toBeNull()
      const { data } = await visitor.rpc("is_plus", { uid })
      expect(data).toBe(expected)
    } finally {
      await service!.from("subscriptions").delete().eq("stripe_subscription_id", SUB_ID)
    }
  })
})
