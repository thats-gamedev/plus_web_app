import Image from "next/image"
import Link from "next/link"
import { DownloadIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Banner } from "@/components/ui/banner"
import { MarkdownArticle } from "@/components/shared/markdown"
import { ResourceBadges, ResourceBreadcrumb } from "@/components/lists/resource-header"
import { coverUrl } from "@/lib/content/covers"
import { readingMinutes } from "@/lib/content/resources"
import type { ResourceDetail } from "@/lib/dal/content"
import { formatDay } from "@/lib/format"
import { contactMailto } from "@/lib/site"

// E-book (MW8 / MM9) and guide pages. Both use the cover card; the e-book
// adds the download, the guide its Markdown body below. Guides have no
// mockup, so they reuse the e-book header.

function Cover({ resource }: { resource: ResourceDetail }) {
  return (
    <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-pastel-cream md:w-64 lg:w-72">
      {resource.coverPath && (
        <Image src={coverUrl(resource.coverPath)} alt="" fill sizes="(min-width: 768px) 288px, 96px" className="object-cover" />
      )}
    </div>
  )
}

function HeaderCard({
  resource,
  meta,
  description,
  children,
}: {
  resource: ResourceDetail
  meta: string
  description: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-panel border border-border bg-card p-5 md:p-7">
      <div className="flex gap-4 md:items-center md:gap-10">
        <Cover resource={resource} />
        <div className="min-w-0 flex-1">
          <ResourceBadges resource={resource} />
          <h1 className="mt-3 text-xl leading-tight font-bold md:text-4xl">{resource.title}</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground md:mt-3 md:text-sm">{meta}</p>
          <div className="mt-4 hidden text-muted-foreground md:block">{description}</div>
          <div className="mt-5 hidden md:block">{children}</div>
        </div>
      </div>
      <div className="mt-4 text-muted-foreground md:hidden">{description}</div>
      <div className="mt-4 md:hidden">{children}</div>
    </div>
  )
}

export function EbookDetail({ resource, downloadFailed }: { resource: ResourceDetail; downloadFailed: boolean }) {
  const href = `/api/download/${resource.id}`

  return (
    <>
      <ResourceBreadcrumb resource={resource} />
      {downloadFailed && (
        <Banner
          variant="danger"
          title="The download didn't start."
          className="mb-4"
          action={
            <a href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Try again
            </a>
          }
        >
          The file may be missing or the link expired. If it keeps failing,{" "}
          <a href={contactMailto(`Download problem: ${resource.title}`)} className="font-semibold underline">
            let us know
          </a>
          .
        </Banner>
      )}
      <HeaderCard
        resource={resource}
        meta={["PDF", `updated ${formatDay(resource.updatedAt)}`].join(" · ")}
        description={resource.bodyMd ? <MarkdownArticle>{resource.bodyMd}</MarkdownArticle> : resource.summary}
      >
        {resource.hasFile ? (
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            {/* A plain link: the route redirects to a signed URL that expires after 60 s. */}
            <a href={href} className={buttonVariants({ size: "lg", className: "w-full md:w-auto" })}>
              <DownloadIcon aria-hidden />
              Download PDF
            </a>
            <p className="hidden text-sm text-faint md:block">Link is valid for 60 seconds.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">The PDF is on its way. Check back soon.</p>
        )}
      </HeaderCard>
    </>
  )
}

export function GuideDetail({ resource }: { resource: ResourceDetail }) {
  const minutes = resource.wordCount ? readingMinutes(resource.wordCount) : null

  return (
    <>
      <ResourceBreadcrumb resource={resource} />
      <HeaderCard
        resource={resource}
        meta={[minutes && `${minutes} min read`, `updated ${formatDay(resource.updatedAt)}`].filter(Boolean).join(" · ")}
        description={resource.summary}
      />
      {resource.bodyMd ? (
        <article className="mt-6 rounded-panel border border-border bg-card px-5 py-6 md:mt-8 md:px-12 md:py-10">
          <MarkdownArticle className="mx-auto max-w-prose">{resource.bodyMd}</MarkdownArticle>
        </article>
      ) : (
        <p className="mt-6 text-muted-foreground">This guide is still being written.</p>
      )}
      <p className="mt-6 text-sm">
        <Link href="/app/library?type=guide" className="font-semibold text-brand hover:underline">
          More guides
        </Link>
      </p>
    </>
  )
}
