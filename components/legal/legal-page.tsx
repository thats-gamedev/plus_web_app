import { Banner } from "@/components/ui/banner"

// Layout for the German legal pages (/imprint, /privacy, /terms,
// /withdrawal). The texts are drafts: every value still to be filled in is
// wrapped in <Ph>, and the banner stays until the final, reviewed texts
// replace them (docs/Open_Items.md).

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article lang="de" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{title}</h1>
      <Banner variant="warning" title="Entwurf" className="mt-6">
        Platzhaltertext. Markierte Angaben fehlen noch; der endgültige, geprüfte Text ersetzt diese Seite vor dem Start.
      </Banner>
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

/** A value that still has to be filled in, e.g. <Ph>Anschrift</Ph>. */
export function Ph({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-warning-soft px-1 font-mono text-[0.9em] text-foreground">[{children}]</mark>
}
