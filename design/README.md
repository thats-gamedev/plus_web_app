# Design system

The mockups in `docs/Mockups` are the source of truth. This file records how they map to code.
Open `/styleguide` (dev only) to see every token and primitive side by side.

## Where things live

- **Tokens:** `app/globals.css` (CSS variables on `:root`, exposed to Tailwind via `@theme inline`)
- **Primitives:** `components/ui/*` (shadcn/ui, restyled, plus a few custom ones)
- **Layout shells:** `components/layout/*` (public header/footer, member shell, admin shell)

Light theme only. The `dark:` variant is bound to a `.dark` class that is never set, so shadcn's
built-in dark styles never activate from the OS setting.

## Colour tokens

Values are estimated from the mockup PNGs; adjust here if the source design files differ.

| Token | Value | Used for |
| --- | --- | --- |
| `background` | `#F3F3F3` | Page background |
| `card` | `#FFFFFF` | Cards, inputs, header |
| `border` / `input` | `#E5E5E5` / `#DCDCDC` | Card borders / input borders |
| `foreground` / `ink` | `#1F1F1F` | Text; dark panels, admin sidebar, active nav pill |
| `ink-2`, `ink-border`, `ink-muted` | `#2A2A2A`, `#3A3A3A`, `#A8A8A8` | Rows, borders and muted text on dark panels |
| `muted-foreground` / `faint` | `#6B6B6B` / `#9A9A9A` | Secondary / tertiary text |
| `brand` (= `primary`, `ring`) | `#E2622B` | Primary buttons, "Plus", links, New badge, focus ring, charts |
| `brand-shadow` | `#B84A1C` | Bottom edge of chunky orange buttons |
| `brand-soft` | `#FBEFE6` | Avatar fill, soft highlights |
| `cat-gamedev` | `#3F7BDB` | Game dev badge; also `info` (Watch, Submitted, Canceled) |
| `cat-3d` | `#5BAE6B` | 3D badge; also `success` (Active, Published) |
| `cat-business` | `#EFC03A` | Business / Affiliate badges; also `warning` (Past due, Pending sync) |
| `cat-ai` | `#1F1F1F` | AI badge |
| `danger` | `#D9473F` | Errors, Delete, Decline, Action |
| `success-soft`, `warning-soft`, `danger-soft` | `#E3F4E8`, `#FDF3D3`, `#FBE5E3` | Banner fills |
| `pastel-{mint,sky,cream,peach,grey}` | `#E3F4E8`, `#E3ECF8`, `#FCF2D0`, `#FBEFE6`, `#E9E9E9` | Placeholder covers and thumbnails |

**Deviation from mockups:** mustard badges (Business, Affiliate, Past due) use dark text instead
of white, because white on `#EFC03A` fails WCAG AA contrast.

## Typography

- **Space Grotesk** (`font-sans`, `font-heading`): all headings and body text. Headings bold with tight tracking.
- **JetBrains Mono** (`font-mono`): metadata lines (`Tools list · 18 items`), member codes, prompts, slugs, counters.
- Helpers: `Eyebrow` (small orange label), `Meta` (mono metadata), `DarkPanel` in `components/ui/typography.tsx`.

## Radii

| Class | Size | Used for |
| --- | --- | --- |
| `rounded-lg` | 10px | Buttons, inputs |
| `rounded-xl` | 12px | Thumbnails, banners |
| `rounded-card` | 16px | Cards |
| `rounded-panel` | 24px | Dark feature panels |
| `rounded-full` | pill | Badges, chips |

## Components

| Component | File | Notes |
| --- | --- | --- |
| `Button` | `ui/button.tsx` | Variants `default` (orange), `dark`, `outline`, `destructive`, `destructive-outline`, `secondary`, `ghost`, `link`. Chunky 3px bottom shadow that collapses on press. |
| `Badge` | `ui/badge.tsx` | `new`, `gamedev`, `3d`, `business`, `ai`, `affiliate`, `success`, `warning`, `danger`, `info`, `outline`, `muted` |
| `Chip`, `ChipGroup` | `ui/chip.tsx` | Filter pills; active = black fill. Single or multi select. |
| `SegmentedControl` | `ui/segmented-control.tsx` | e.g. Newest / A–Z |
| `PasswordInput` | `ui/password-input.tsx` | Show/Hide toggle |
| `CountedTextarea` | `ui/counted-textarea.tsx` | `0 / 300` counter |
| `Banner` | `ui/banner.tsx` | `info`, `success`, `warning`, `danger`, with optional action |
| `CopyButton` | `ui/copy-button.tsx` | Copies and toasts |
| `PlaceholderCover` | `ui/placeholder-cover.tsx` | Pastel tile with an icon |
| shadcn | `ui/*` | Card, Input, Textarea, Select, Checkbox, Switch, Tabs, Dialog, Sheet, Accordion, Tooltip, Toast (sonner), Skeleton, … |

## Rules

- Use tokens only; never hard-code hex values in components.
- Mobile-first: most visitors arrive from Instagram on a phone.
- Motion is limited to hover states, button presses and toasts.
