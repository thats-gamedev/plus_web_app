import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { CodeBanner, ProductCard } from "@/components/shop/shop-parts"
import { Skeleton } from "@/components/ui/skeleton"
import { CODE_PERCENT } from "@/lib/codes/generate"
import { requirePlus } from "@/lib/dal/auth"
import { getMemberCodes } from "@/lib/dal/perks"
import type { ShopProduct } from "@/lib/fourthwall/products"
import { getShopProducts, shopConfig } from "@/lib/fourthwall/storefront"

export const metadata: Metadata = { title: "Shop" }

export default function ShopPage() {
  return (
    <>
      <PageHeader title="Shop" />
      <Suspense fallback={<ShopSkeleton />}>
        <Shop />
      </Suspense>
    </>
  )
}

// Merch from Fourthwall with member prices (MM10; desktop uses 4 columns).
// No cart: Buy opens the product on Fourthwall with the code copied.
async function Shop() {
  await requirePlus()
  const config = shopConfig()
  const codes = await getMemberCodes()
  const merch = codes.find((c) => c.kind === "merch")
  // A pending code isn't known to Fourthwall yet, so don't hand it out.
  const code = merch?.status === "active" ? merch.code : null
  const percent = merch?.percent ?? CODE_PERCENT.merch

  let products: ShopProduct[] | null = null
  if (config) {
    try {
      products = await getShopProducts(config.collection)
    } catch (error) {
      console.error("Fourthwall storefront failed", { error: String(error) })
    }
  }

  return (
    <>
      <CodeBanner code={code} percent={percent} />
      {config && products && products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                index={index}
                percent={percent}
                code={code}
                shopUrl={config.shopUrl}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-dashed border-border bg-card p-6">
          <p className="font-semibold">
            {config ? "The shop is taking a break." : "The shop opens soon."}
          </p>
          {config ? (
            <a
              href={config.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-semibold text-brand hover:underline"
            >
              Visit it directly
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Your member code will work there from day one.</p>
          )}
        </div>
      )}
    </>
  )
}

function ShopSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="mb-5 h-16 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-card" />
        ))}
      </div>
    </div>
  )
}
