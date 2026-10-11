// Admin list pages on desktop (lg+): the page fills the window (the admin
// main has 2rem padding top and bottom), title and filters stay put and only
// the list scrolls. Below lg the page scrolls as usual.

/** The page column; put the title, filters and one list inside. */
export function ListPage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col lg:h-[calc(100dvh-4rem)]">{children}</div>
}

/**
 * For the list's container: it keeps its own height while it fits and
 * shrinks and scrolls once it doesn't, without scrolling the page at its end.
 */
export const listScroll = "lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"

/** For a table's thead inside a listScroll container: stays on top. */
export const stickyHead = "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"
