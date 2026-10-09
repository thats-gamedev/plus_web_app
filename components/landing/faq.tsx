"use client"

import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// FAQ (LW6): plus/minus instead of the accordion's default chevrons.
const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What do I get each month?",
    a: "A new drop, usually an updated list, a prompts list and a short guide, on top of the full library. Every quarter there's an e-book, and your perk codes work all year.",
  },
  {
    q: "Can I cancel anytime?",
    a: (
      <>
        Yes. Cancel in your account or with <Link href="/cancel">Cancel contracts here</Link> at the bottom of every
        page. You keep access until the end of the period you paid for.
      </>
    ),
  },
  {
    q: "Is the coding app included?",
    a: "Yes. Code Your Hero Pro is included for free in your Plus membership when the app launches.",
  },
  {
    q: "Who curates the lists?",
    a: "The team behind @thats_gamedev. Every pick is something we've used or checked, with one line on why it made the list.",
  },
  {
    q: "Do you use affiliate links?",
    a: "Sometimes. They're always marked with a badge, and they never decide what makes a list.",
  },
  {
    q: "Which payment methods work?",
    a: "Cards, Apple Pay, Google Pay and other local methods Stripe offers in your country.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="bg-card">
      <div className="mx-auto grid max-w-6xl scroll-mt-24 gap-6 px-4 py-14 sm:px-6 md:grid-cols-[1fr_2fr] md:py-24 lg:px-10">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">FAQ</h2>
        <Accordion type="single" collapsible>
          {QUESTIONS.map(({ q, a }) => (
            <AccordionItem key={q} value={q} className="border-b border-border">
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline md:text-lg **:data-[slot=accordion-trigger-icon]:hidden">
                {q}
                <span aria-hidden className="ml-4 font-mono text-xl leading-none text-brand group-aria-expanded/accordion-trigger:hidden">
                  +
                </span>
                <span aria-hidden className="ml-4 hidden font-mono text-xl leading-none text-brand group-aria-expanded/accordion-trigger:inline">
                  −
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
