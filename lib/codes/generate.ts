import type { Enums } from "@/lib/supabase/database.types"

// Member code format: TGD-MERCH-7K4Q9X / TGD-PROMO-3H8WQ2 (spec, "Code
// design"). Members read these aloud and type them at checkout, so the
// alphabet leaves out look-alikes (0/O, 1/I/L).

export type CodeKind = Enums<"code_kind">

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
export const CODE_SUFFIX_LENGTH = 6

export const CODE_PREFIXES: Record<CodeKind, string> = {
  merch: "TGD-MERCH-",
  promotion: "TGD-PROMO-",
}

/** Discount per code kind, in percent. */
export const CODE_PERCENT: Record<CodeKind, number> = {
  merch: 15,
  promotion: 10,
}

export const CODE_KINDS: readonly CodeKind[] = ["merch", "promotion"]

const CODE_PATTERN = new RegExp(
  `^TGD-(MERCH|PROMO)-[${CODE_ALPHABET}]{${CODE_SUFFIX_LENGTH}}$`
)

/** Random bytes source; crypto.getRandomValues in production, fixed in tests. */
export type RandomBytes = (length: number) => Uint8Array

const cryptoBytes: RandomBytes = (length) => crypto.getRandomValues(new Uint8Array(length))

/**
 * A new code such as "TGD-MERCH-7K4Q9X". Uses rejection sampling, so every
 * character of the alphabet is equally likely.
 */
export function generateCode(kind: CodeKind, randomBytes: RandomBytes = cryptoBytes): string {
  const n = CODE_ALPHABET.length
  // Largest multiple of n below 256; bytes at or above it would skew the odds.
  const limit = 256 - (256 % n)
  let suffix = ""
  while (suffix.length < CODE_SUFFIX_LENGTH) {
    for (const byte of randomBytes(CODE_SUFFIX_LENGTH * 2)) {
      if (byte < limit) suffix += CODE_ALPHABET[byte % n]
      if (suffix.length === CODE_SUFFIX_LENGTH) break
    }
  }
  return CODE_PREFIXES[kind] + suffix
}

export function isMemberCode(value: string): boolean {
  return CODE_PATTERN.test(value)
}
