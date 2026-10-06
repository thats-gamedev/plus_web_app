"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckIcon } from "lucide-react"
import { Eyebrow } from "@/components/ui/typography"
import { DEFAULT_PLAN, parsePlan, PLAN_BENEFITS, PLANS } from "@/lib/plans"

function usePlan() {
  const plan = parsePlan(useSearchParams().get("plan")) ?? DEFAULT_PLAN
  return PLANS[plan]
}

/** Desktop side panel on /signup: the chosen plan and what it includes. */
export function PlanPanel() {
  const plan = usePlan()

  return (
    <div className="px-16 py-20">
      <Eyebrow>Your plan</Eyebrow>
      <div className="mt-6 flex items-baseline justify-between gap-4">
        <h2 className="text-3xl font-bold">{plan.name}</h2>
        <p className="text-3xl font-bold">
          {plan.price}
          <span className="ml-1 text-base font-normal text-white/70">{plan.interval}</span>
        </p>
      </div>
      <p className="mt-6 text-white/70">
        Price locked as long as you stay.{" "}
        <Link href="/#pricing" className="font-semibold text-brand hover:underline">
          Change plan
        </Link>
      </p>
      <ul className="mt-6 space-y-5 border-t border-white/15 pt-6">
        {PLAN_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center gap-3">
            <CheckIcon aria-hidden className="size-4 text-brand" />
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Compact plan bar above the sign-up form on mobile (LM8). */
export function PlanBar() {
  const plan = usePlan()

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-ink px-4 py-3.5 text-white lg:hidden">
      <div>
        <Eyebrow>Your plan</Eyebrow>
        <p className="font-semibold">
          {plan.name} · {plan.price}
          {plan.interval}
        </p>
      </div>
      <Link href="/#pricing" className="text-sm font-semibold text-brand">
        Change
      </Link>
    </div>
  )
}
