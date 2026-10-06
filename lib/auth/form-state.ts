// Result of a form Server Action, consumed with useActionState.
export type FormState = {
  status: "idle" | "error" | "success"
  /** Form-level message, e.g. "Email or password is wrong." */
  message?: string
  fieldErrors?: Record<string, string>
  /** Non-secret values to put back into the form after an error. */
  values?: Record<string, string>
}

export const idleState: FormState = { status: "idle" }

/** Reads text fields from FormData; missing or file fields become "". */
export function readFields<K extends string>(formData: FormData, keys: readonly K[]) {
  return Object.fromEntries(
    keys.map((key) => {
      const value = formData.get(key)
      return [key, typeof value === "string" ? value : ""]
    }),
  ) as Record<K, string>
}
