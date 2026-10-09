"use client"

import Image from "next/image"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { formatMoney, memberPrice, productUrl, type ShopProduct } from "@/lib/fourthwall/products"

/** "Buy": copies the member code, then opens the product on Fourthwall (spec). */
function BuyButton({ href, code, className }: { href: string; code: string | null; className?: string }) {
  async function buy() {
    // Open first: browsers block window.open after an awaited clipboard call.
    window.open(href, "_blank", "noopener")
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Code copied. Paste it at checkout.")
    } catch {
      toast.message(`Your code: ${code}`, { description: "Paste it at checkout." })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={buy} className={className}>
      Buy
    </Button>
  )
}

const pastels = ["bg-pastel-peach", "bg-pastel-grey", "bg-pastel-sky", "bg-pastel-mint"]

// Product card (MM10): image (second image on hover), name, member price in
// brand colour next to the struck-through regular price, Buy.
export function ProductCard({
  product,
  index,
  percent,
  code,
  shopUrl,
  compact = false,
}: {
  product: ShopProduct
  index: number
  percent: number
  code: string | null
  shopUrl: string
  /** Horizontal card for the home page's "New merch" row (MW1). */
  compact?: boolean
}) {
  const [first, second] = product.images
  const price = formatMoney(memberPrice(product.price.value, percent), product.price.currency)
  const regular = formatMoney(product.price.value, product.price.currency)

  return (
    <article
      className={cn(
        "group flex overflow-hidden rounded-card border border-border bg-card",
        compact ? "items-center gap-4 p-3" : "flex-col"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden",
          pastels[index % pastels.length],
          compact ? "size-20 rounded-xl" : "aspect-square w-full"
        )}
      >
        {first && (
          <Image
            src={first}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={cn("object-cover transition-opacity", second && "group-hover:opacity-0")}
          />
        )}
        {second && (
          <Image src={second} alt="" fill unoptimized sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <div className={cn("flex min-w-0 flex-1", compact ? "items-center gap-3" : "flex-col p-3")}>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold md:text-base">{product.name}</h3>
          <p className="mt-0.5 font-mono text-sm">
            <span className="font-semibold text-brand">{price}</span>{" "}
            <span className="text-xs text-faint line-through">{regular}</span>
            <span className="sr-only"> member price, regular {regular}</span>
          </p>
        </div>
        {product.soldOut ? (
          <p className={cn("text-sm text-muted-foreground", !compact && "mt-2")}>Sold out</p>
        ) : (
          <BuyButton href={productUrl(shopUrl, product.slug)} code={code} className={compact ? undefined : "mt-2 w-full"} />
        )}
      </div>
    </article>
  )
}

/** Dark code banner at the top of /app/shop (MM10). */
export function CodeBanner({ code, percent }: { code: string | null; percent: number }) {
  return (
    <div className="mb-5 flex items-center gap-4 rounded-card bg-ink px-4 py-3.5 text-white md:px-5">
      <div className="min-w-0 flex-1">
        {code ? (
          <>
            <p className="font-mono text-sm text-brand md:text-base">{code}</p>
            <p className="text-xs text-ink-muted md:text-sm">{percent}% off · paste it at checkout</p>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Your {percent}% member code is being created. Refresh in a minute.
          </p>
        )}
      </div>
      {code && (
        <CopyButton value={code} toastMessage="Code copied" variant="default" size="sm">
          Copy
        </CopyButton>
      )}
    </div>
  )
}
