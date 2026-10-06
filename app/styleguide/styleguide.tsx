"use client"

import * as React from "react"
import { BookOpenIcon, ListChecksIcon, SparklesIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ChipGroup } from "@/components/ui/chip"
import { CopyButton } from "@/components/ui/copy-button"
import { CountedTextarea } from "@/components/ui/counted-textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { PlaceholderCover } from "@/components/ui/placeholder-cover"
import { SegmentedControl } from "@/components/ui/segmented-control"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { DarkPanel, Eyebrow, Meta } from "@/components/ui/typography"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  )
}

const swatches = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["border", "bg-border"],
  ["muted", "bg-muted"],
  ["foreground / ink", "bg-ink"],
  ["ink-2", "bg-ink-2"],
  ["muted-foreground", "bg-muted-foreground"],
  ["faint", "bg-faint"],
  ["brand", "bg-brand"],
  ["brand-shadow", "bg-brand-shadow"],
  ["brand-soft", "bg-brand-soft"],
  ["cat-gamedev", "bg-cat-gamedev"],
  ["cat-3d", "bg-cat-3d"],
  ["cat-business", "bg-cat-business"],
  ["danger", "bg-danger"],
  ["success-soft", "bg-success-soft"],
  ["warning-soft", "bg-warning-soft"],
  ["pastel-mint", "bg-pastel-mint"],
  ["pastel-sky", "bg-pastel-sky"],
  ["pastel-cream", "bg-pastel-cream"],
  ["pastel-peach", "bg-pastel-peach"],
  ["pastel-grey", "bg-pastel-grey"],
] as const

export function Styleguide() {
  const [kind, setKind] = React.useState("all")
  const [platforms, setPlatforms] = React.useState<string[]>(["youtube"])
  const [sort, setSort] = React.useState<"newest" | "az">("newest")

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
      <header>
        <Meta>dev only · /styleguide</Meta>
        <h1 className="mt-2 text-5xl font-bold">Styleguide</h1>
        <p className="mt-2 text-muted-foreground">
          Tokens and primitives from <code className="font-mono">app/globals.css</code> and{" "}
          <code className="font-mono">components/ui</code>. Compare with docs/Mockups.
        </p>
      </header>

      <Section title="Colours">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {swatches.map(([name, cls]) => (
            <div key={name} className="space-y-1.5">
              <div className={`h-14 rounded-xl border border-border ${cls}`} />
              <Meta>{name}</Meta>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <h1 className="text-6xl leading-none font-bold md:text-7xl">The toolkit we&rsquo;d hand a friend.</h1>
        <h2 className="text-4xl font-bold">October: Stylized texturing</h2>
        <h3 className="text-2xl font-semibold">Recently added</h3>
        <p className="max-w-xl text-lg text-muted-foreground">
          Curated tools, assets, prompts and guides. Updated every month.
        </p>
        <Eyebrow>This month&apos;s drop</Eyebrow>
        <Meta>Tools list · 18 items · TGD-MERCH-7K4Q9X</Meta>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Join as a founding member</Button>
          <Button variant="dark">Continue</Button>
          <Button variant="outline">Log in</Button>
          <Button variant="destructive">Delete member</Button>
          <Button variant="destructive-outline">Decline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Open library</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Large</Button>
          <Button>Default</Button>
          <Button size="sm" variant="outline">Buy</Button>
          <Button size="xs" variant="outline">See codes</Button>
          <Button onClick={() => toast.success("Code copied. Paste it at checkout.")} variant="outline">
            Show toast
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge variant="new">New</Badge>
          <Badge variant="gamedev">Game dev</Badge>
          <Badge variant="3d">3D</Badge>
          <Badge variant="business">Business</Badge>
          <Badge variant="ai">AI</Badge>
          <Badge variant="affiliate">Affiliate</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Past due</Badge>
          <Badge variant="danger">Action</Badge>
          <Badge variant="info">Watch</Badge>
          <Badge variant="outline">Draft</Badge>
          <Badge variant="muted">Revoked</Badge>
        </div>
      </Section>

      <Section title="Chips & segmented control">
        <ChipGroup
          aria-label="Kind"
          value={kind}
          onChange={setKind}
          options={[
            { value: "all", label: "All" },
            { value: "tools", label: "Tools" },
            { value: "assets", label: "Assets" },
            { value: "creators", label: "Creators" },
            { value: "prompts", label: "Prompts" },
          ]}
        />
        <ChipGroup
          multiple
          aria-label="Platforms"
          value={platforms}
          onChange={setPlatforms}
          options={[
            { value: "youtube", label: "YouTube" },
            { value: "instagram", label: "Instagram" },
            { value: "artstation", label: "ArtStation" },
          ]}
        />
        <SegmentedControl
          aria-label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: "newest", label: "Newest" },
            { value: "az", label: "A–Z" },
          ]}
        />
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { tone: "mint", icon: ListChecksIcon, meta: "Tools list · 3D", title: "25 texturing tools we actually use", isNew: true },
            { tone: "grey", icon: SparklesIcon, meta: "Prompts list · AI", title: "Stylized material prompts", isNew: true },
            { tone: "cream", icon: BookOpenIcon, meta: "E-book · Business", title: "Pricing your first freelance 3D job", isNew: false },
          ].map((c) => (
            <Card key={c.title} size="sm" className="flex-row items-center gap-4 px-4">
              <PlaceholderCover tone={c.tone as "mint"} className="size-14">
                <c.icon />
              </PlaceholderCover>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {c.meta} {c.isNew && <Badge variant="new">New</Badge>}
                </p>
                <p className="mt-1 font-semibold">{c.title}</p>
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Merch code · 15% off</CardTitle>
            <CardDescription>Paste it at checkout in the shop.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-2xl font-bold tracking-wide">TGD-MERCH-7K4Q9X</span>
            <CopyButton value="TGD-MERCH-7K4Q9X" toastMessage="Code copied. Paste it at checkout." />
          </CardContent>
        </Card>
        <DarkPanel>
          <Eyebrow>This month</Eyebrow>
          <h3 className="mt-3 text-4xl font-bold">October: Stylized texturing</h3>
          <p className="mt-3 max-w-md text-ink-muted">
            Hand-painted looks without hand-painting everything.
          </p>
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-ink-border bg-ink-2 p-4">
            <UsersIcon className="size-5 text-brand" />
            <div>
              <p className="font-semibold">Blender creators worth following</p>
              <Meta className="text-ink-muted">Creators list · 22 items</Meta>
            </div>
          </div>
        </DarkPanel>
      </Section>

      <Section title="Banners">
        <Banner variant="warning" title="Payment failed" action={<Button size="sm" variant="dark">Update card</Button>}>
          We couldn&apos;t charge your card. Update it to keep your access.
        </Banner>
        <Banner variant="success" title="Check your inbox">
          If an account exists for that email, we sent a reset link.
        </Banner>
        <Banner variant="danger" title="Email or password is wrong" />
        <Banner title="Your code is being created">Refresh in a minute.</Banner>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-md gap-5">
          <div className="grid gap-2">
            <Label htmlFor="sg-email">Email</Label>
            <Input id="sg-email" type="email" placeholder="you@studio.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-email-err">Email (error)</Label>
            <Input id="sg-email-err" aria-invalid defaultValue="mara@studio" />
            <p className="text-sm text-danger">Email or password is wrong</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-pass">Password</Label>
            <PasswordInput id="sg-pass" defaultValue="supersecret1" />
            <p className="text-sm text-muted-foreground">At least 10 characters.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-desc">Short description</Label>
            <CountedTextarea id="sg-desc" maxLength={300} placeholder="What did you make?" />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select defaultValue="3d">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gamedev">Game dev</SelectItem>
                <SelectItem value="3d">3D</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox className="mt-0.5" />
            <span>
              I want immediate access and understand that my right of withdrawal ends once access
              starts.
            </span>
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Drop emails</span>
            <Switch defaultChecked />
          </label>
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full rounded-card" />
        </div>
      </Section>
    </div>
  )
}
