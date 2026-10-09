import { describe, expect, it } from "vitest"
import { formatMoney, memberPrice, productUrl, toShopProduct } from "./products"

const raw = {
  type: "PRODUCT",
  id: "prod_1",
  name: "Ember logo hoodie",
  slug: "ember-logo-hoodie",
  state: { type: "AVAILABLE" },
  price: { value: 54, currency: "USD" },
  images: [{ url: "https://cdn.fourthwall.com/a.png", width: 800 }, { url: "https://cdn.fourthwall.com/b.png" }],
  someFutureField: true,
}

describe("toShopProduct", () => {
  it("maps the documented fields and ignores unknown ones", () => {
    expect(toShopProduct(raw)).toEqual({
      id: "prod_1",
      name: "Ember logo hoodie",
      slug: "ember-logo-hoodie",
      price: { value: 54, currency: "USD" },
      compareAtPrice: null,
      images: ["https://cdn.fourthwall.com/a.png", "https://cdn.fourthwall.com/b.png"],
      soldOut: false,
    })
  })

  it("falls back to the first variant price and reads a plain state string", () => {
    const product = toShopProduct({
      ...raw,
      price: undefined,
      state: "SOLD_OUT",
      variants: [{ id: "v1" }, { id: "v2", unitPrice: { value: 30, currency: "EUR" } }],
    })
    expect(product).toMatchObject({ price: { value: 30, currency: "EUR" }, soldOut: true })
  })

  it("skips products it can't show", () => {
    expect(toShopProduct({ ...raw, price: undefined })).toBeNull()
    expect(toShopProduct({ name: "No id" })).toBeNull()
    expect(toShopProduct(null)).toBeNull()
  })
})

describe("memberPrice", () => {
  it("takes the discount off and rounds to cents", () => {
    expect(memberPrice(54, 15)).toBe(45.9)
    expect(memberPrice(58, 15)).toBe(49.3)
    expect(memberPrice(9.99, 15)).toBe(8.49)
  })
})

describe("formatMoney and productUrl", () => {
  it("formats money and builds product links", () => {
    expect(formatMoney(45.9, "USD")).toBe("$45.90")
    expect(productUrl("https://shop.example.com/", "ember hoodie")).toBe("https://shop.example.com/products/ember%20hoodie")
  })
})
