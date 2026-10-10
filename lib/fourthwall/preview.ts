import type { ShopProduct } from "./products"

// Development-only stand-in for the Fourthwall catalog, to see /app/shop and
// the home page's "New merch" row before the shop exists. On with
// SHOP_PREVIEW=1 in .env.local; ignored in production builds and as soon as
// real Fourthwall credentials are set. No images: the cards show their
// pastel placeholders.

export function shopPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.SHOP_PREVIEW === "1" &&
    !process.env.FOURTHWALL_STOREFRONT_TOKEN
  )
}

export const PREVIEW_SHOP_URL = "https://example.com/shop"

const usd = (value: number) => ({ value, currency: "USD" })

export const PREVIEW_PRODUCTS: ShopProduct[] = [
  { id: "preview-1", name: "Low Poly Club Tee", slug: "low-poly-club-tee", price: usd(29), compareAtPrice: null, images: [], soldOut: false },
  { id: "preview-2", name: "Shader Wizard Hoodie", slug: "shader-wizard-hoodie", price: usd(59), compareAtPrice: null, images: [], soldOut: false },
  { id: "preview-3", name: "Ctrl+Z Life Cap", slug: "ctrl-z-life-cap", price: usd(25), compareAtPrice: usd(32), images: [], soldOut: false },
  { id: "preview-4", name: "Normal Map Crewneck", slug: "normal-map-crewneck", price: usd(49), compareAtPrice: null, images: [], soldOut: false },
  { id: "preview-5", name: "Game Jam Survivor Tee", slug: "game-jam-survivor-tee", price: usd(29), compareAtPrice: null, images: [], soldOut: true },
  { id: "preview-6", name: "UV Unwrapped Tote", slug: "uv-unwrapped-tote", price: usd(22), compareAtPrice: null, images: [], soldOut: false },
  { id: "preview-7", name: "Polycount Beanie", slug: "polycount-beanie", price: usd(27), compareAtPrice: null, images: [], soldOut: false },
  { id: "preview-8", name: "Bake It Till You Make It Tee", slug: "bake-it-tee", price: usd(29), compareAtPrice: null, images: [], soldOut: false },
]
