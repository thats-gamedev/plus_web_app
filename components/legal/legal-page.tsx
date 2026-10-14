import { Banner } from "@/components/ui/banner"

// Layout for the legal pages (/imprint, /privacy, /terms, /withdrawal).
// The site is in English; the pages apply German law. Values still to be
// filled in are wrapped in <Ph>; the "Draft" banner shows while any are left.

/**
 * Who runs the site: named in the terms, privacy policy and withdrawal
 * policy. Fill these in (null renders a highlighted placeholder); the
 * imprint has its own fields.
 */
const PROVIDER: { name: string | null; street: string | null; city: string | null } = {
  name: null,
  street: null,
  city: null,
}

const providerMissing = Object.values(PROVIDER).some((value) => value === null)

/** Date the terms and privacy policy were last changed. */
export const LEGAL_UPDATED = "14 October 2026"

export function LegalPage({
  title,
  draft = providerMissing,
  children,
}: {
  title: string
  draft?: boolean
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{title}</h1>
      {draft && (
        <Banner variant="warning" title="Draft" className="mt-6">
          Highlighted details are still missing; they are filled in before launch.
        </Banner>
      )}
      <div className="mt-10 space-y-10 leading-relaxed [&_a]:text-brand [&_a]:underline [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </article>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  )
}

/** A value that still has to be filled in, e.g. <Ph>Address</Ph>. */
export function Ph({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-warning-soft px-1 font-mono text-[0.9em] text-foreground">[{children}]</mark>
}

export function ProviderName() {
  return PROVIDER.name ?? <Ph>First and last name</Ph>
}

/** Name and postal address, on separate lines or (inline) separated by commas. */
export function ProviderAddress({ inline = false }: { inline?: boolean }) {
  const parts = [
    <ProviderName key="name" />,
    PROVIDER.street ?? <Ph key="street">Street and number</Ph>,
    PROVIDER.city ?? <Ph key="city">Postcode and city</Ph>,
    "Germany",
  ]
  return parts.map((part, i) => (
    <span key={i}>
      {i > 0 && (inline ? ", " : <br />)}
      {part}
    </span>
  ))
}
