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
  { id: "preview-1", name: "Low Poly Club Tee", slug: "low-poly-club-tee", price: usd(29), compareAtPrice: null, images: [], description: "Heavyweight cotton tee with a tiny low poly crest. Boxy fit that survives every crunch week.", soldOut: false },
  { id: "preview-2", name: "Shader Wizard Hoodie", slug: "shader-wizard-hoodie", price: usd(59), compareAtPrice: null, images: [], description: "Soft brushed fleece with a glowing node graph on the back. Warm enough for late-night shader debugging.", soldOut: false },
  { id: "preview-3", name: "Ctrl+Z Life Cap", slug: "ctrl-z-life-cap", price: usd(25), compareAtPrice: usd(32), images: [], description: "Embroidered dad cap for everyone who undoes more than they do. One size, adjustable strap.", soldOut: false },
  { id: "preview-4", name: "Normal Map Crewneck", slug: "normal-map-crewneck", price: usd(49), compareAtPrice: null, images: [], description: "Crewneck in a subtle purple-blue gradient, like a normal map. Garment dyed, so no two are alike.", soldOut: false },
  { id: "preview-5", name: "Game Jam Survivor Tee", slug: "game-jam-survivor-tee", price: usd(29), compareAtPrice: null, images: [], description: "Limited tee for everyone who shipped a game in 48 hours. Back print lists the essentials: coffee, git, sleep.", soldOut: true },
  { id: "preview-6", name: "UV Unwrapped Tote", slug: "uv-unwrapped-tote", price: usd(22), compareAtPrice: null, images: [], description: "Sturdy canvas tote printed with an unwrapped cube. Fits a laptop, a sketchbook and snacks.", soldOut: false },
  { id: "preview-7", name: "Polycount Beanie", slug: "polycount-beanie", price: usd(27), compareAtPrice: null, images: [], description: "Rib-knit beanie with a woven polycount badge. Keeps your head warm while your GPU stays hot.", soldOut: false },
  { id: "preview-8", name: "Bake It Till You Make It Tee", slug: "bake-it-tee", price: usd(29), compareAtPrice: null, images: [], description: "Classic tee for the texture artists. Soft-washed print that only gets better after every bake.", soldOut: false },
]
