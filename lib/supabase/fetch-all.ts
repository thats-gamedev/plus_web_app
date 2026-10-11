// Supabase returns at most `max_rows` (1000) rows per request and cuts the
// rest off silently. Admin overviews, exports and crons that must see every
// row read page by page instead. The query needs a stable order (e.g. by id),
// or rows can repeat or go missing between pages.

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

export const PAGE_SIZE = 1000

/** Calls `page(from, to)` until a page comes back short; throws on errors. */
export async function fetchAll<T>(page: (from: number, to: number) => Page<T>, size = PAGE_SIZE): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < size) return rows
  }
}
