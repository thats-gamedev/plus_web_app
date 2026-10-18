"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FAQ } from "@/lib/content/faq"

// FAQ (LW6): plus/minus instead of the accordion's default chevrons. The
// answers stay in the HTML while collapsed (forceMount, hidden when closed),
// so search engines and LLMs read them too.
export function Faq() {
  return (
    <section id="faq" className="bg-card">
      <div className="mx-auto grid max-w-6xl scroll-mt-24 gap-8 px-7 pt-16 pb-44 sm:px-6 md:grid-cols-[1fr_2fr] md:pt-24 lg:pb-60 lg:px-10">
        <h2 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl md:text-5xl">FAQ</h2>
        <Accordion type="single" collapsible>
          {FAQ.map(({ q, a }) => (
            <AccordionItem key={q} value={q} className="border-b border-border">
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline md:text-lg **:data-[slot=accordion-trigger-icon]:hidden">
                {q}
                {/* A plus whose vertical bar folds away into a minus when open. */}
                <span aria-hidden className="relative ml-4 size-3.5 shrink-0 self-center text-brand">
                  <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 group-aria-expanded/accordion-trigger:scale-y-0" />
                </span>
              </AccordionTrigger>
              <AccordionContent forceMount className="pb-5 text-base leading-relaxed text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
