import "server-only"
import { FAQ } from "@/lib/content/faq"
import { dropHeading, dropSummary } from "@/lib/content/landing"
import { categoryLabels, resourceTypeLabel } from "@/lib/content/resources"
import { getLandingData, getPublicList, getPublicListSlugs, type PublicList } from "@/lib/dal/public"
import type { ListItem, ListSection } from "@/lib/lists/schema"
import { teaserItemCount } from "@/lib/lists/teaser"
import { PLAN_BENEFITS, PLANS } from "@/lib/plans"
import { INSTAGRAM_HANDLE, LONG_DESCRIPTION, SAME_AS, SITE_NAME, TAGLINE } from "@/lib/seo"
import { SITE_URL } from "@/lib/site-url"

// The site as plain Markdown for LLMs and AI assistants, following the
// llms.txt proposal (https://llmstxt.org): /llms.txt is the short map with
// links, /llms-full.txt the whole public content in one file. Both come from
// the same data and copy as the pages (cached, refreshed when content is
// published), so they never say something the site doesn't.

const url = (path: string) => `${SITE_URL}${path}`

async function publicLists(): Promise<PublicList[]> {
  const slugs = await getPublicListSlugs()
  const lists = await Promise.all(slugs.map(({ slug }) => getPublicList(slug)))
  return lists.filter((list): list is PublicList => list !== null)
}

function listLine(list: PublicList) {
  const kind = resourceTypeLabel({ type: "list", listKind: list.listKind })
  const summary = list.summary ? `: ${list.summary}` : ""
  return `- [${list.title}](${url(`/lists/${list.slug}`)}) (${kind}, ${categoryLabels[list.category]}, ${list.itemCount} entries)${summary}`
}

const plans = () =>
  [
    `- ${PLANS.founding_monthly.name}: ${PLANS.founding_monthly.price} per month`,
    `- ${PLANS.founding_annual.name}: ${PLANS.founding_annual.price} per year (two months free)`,
    "- Founding prices are available until Code Your Hero launches; after that Plus costs $12.99/month for new members. Founding members keep their price while they stay subscribed.",
    "- Prices include VAT. Cancel anytime from your account; access lasts until the end of the period paid for.",
  ].join("\n")

const legalLinks = [
  `- [Imprint](${url("/imprint")})`,
  `- [Privacy policy](${url("/privacy")})`,
  `- [Terms](${url("/terms")})`,
  `- [Withdrawal policy](${url("/withdrawal")})`,
  `- [Cancel your membership](${url("/cancel")})`,
].join("\n")

/** /llms.txt: what the site is, and where to read more. */
export async function llmsTxt(): Promise<string> {
  const lists = await publicLists()
  return `# ${SITE_NAME}

> ${TAGLINE}: hand-picked tools, assets, AI prompts and guides, with a new drop every month. A membership by the team behind the ${INSTAGRAM_HANDLE} Instagram page.

${LONG_DESCRIPTION}

## Main pages

- [Home](${url("/")}): what the membership includes, the latest drop, a free list, pricing and the FAQ
- [Pricing](${url("/#pricing")}): the founding plans
- [FAQ](${url("/#faq")}): common questions
- [Join](${url("/signup")}): create an account

## Membership and prices

${plans()}

## Free lists

Each list shows its top picks free for everyone; members see the whole list.

${lists.length ? lists.map(listLine).join("\n") : "- New lists are published every month."}

## Legal

${legalLinks}

## Optional

- [Full content as Markdown](${url("/llms-full.txt")}): every public section, the FAQ and the free list picks in one file
- [Instagram ${INSTAGRAM_HANDLE}](${SAME_AS[0]})
`
}

function itemLines(list: PublicList) {
  const items = (list.doc.sections as ListSection[]).flatMap((s): ListItem[] => s.items)
  return items
    .map((item) => {
      const link = "url" in item && item.url ? ` (${item.url})` : ""
      return `- **${item.name}**${link}: ${item.why}`
    })
    .join("\n")
}

/** /llms-full.txt: all public content in one Markdown file. */
export async function llmsFullTxt(): Promise<string> {
  const [data, lists] = await Promise.all([getLandingData(), publicLists()])
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL

  const drop = data.drop
    ? `## ${data.drop.isCurrentMonth ? "This month's drop" : "The latest drop"} (${dropHeading(data.drop)})

${dropSummary(data.drop.kinds) ?? ""} Members get it the day it drops; new drops come out every month.
`
    : ""

  const listSections = lists
    .map((list) => {
      const free = teaserItemCount(list.doc)
      return `### ${list.title}

${list.summary ? `${list.summary}\n\n` : ""}${resourceTypeLabel({ type: "list", listKind: list.listKind })}, ${categoryLabels[list.category]}. ${list.itemCount} entries; the top ${free} are free for everyone: ${url(`/lists/${list.slug}`)}

${itemLines(list)}
`
    })
    .join("\n")

  return `# ${SITE_NAME}

> ${TAGLINE}. ${url("/")}

${LONG_DESCRIPTION}

## What's inside

- **Curated lists:** tools, assets and creators to follow on YouTube, Instagram and more, each pick with one line on why it made the list.
- **Prompt packs:** AI prompts for concept art, code and marketing, with fill-in fields.
- **Guides and e-books:** pricing, portfolios and workflows, written for game devs and 3D artists. A new e-book every quarter.
- **Perks:** 15% off thats_gamedev clothing and 10% off page promotions.
- **Get featured on ${INSTAGRAM_HANDLE}:** members submit one game or 3D project a month; the team picks 3–5 every month and posts them with credit.
- **Code Your Hero (coming soon):** a gamedev coding app for learning Unity C# in bite-sized lessons, where the code you write becomes your hero's abilities. Code Your Hero Pro is included free in the Plus membership.

Engines and tools covered: Unity, Unreal, Blender, Maya.

${drop}
## Membership and prices

${plans()}

Every plan includes:
${PLAN_BENEFITS.map((b) => `- ${b}`).join("\n")}

Join: ${url("/signup")}

## Free lists

${listSections || "New lists are published every month.\n"}
## FAQ

${FAQ.map(({ q, a }) => `### ${q}\n\n${a}`).join("\n\n")}

## About

${SITE_NAME} is run by the team behind the ${INSTAGRAM_HANDLE} Instagram page (${SAME_AS[0]}).${contact ? ` Contact: ${contact}.` : ""}

## Legal

${legalLinks}
`
}
