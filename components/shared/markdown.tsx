import type { ComponentPropsWithoutRef, ElementType } from "react"
import Markdown, { type Components, type ExtraProps } from "react-markdown"
import { cn } from "cn"

// Article Markdown (guides, e-book descriptions) styled with the design
// tokens. react-markdown never renders raw HTML, so admin-written content
// can't inject markup. Images are dropped until guides get uploads.

/** An element with base classes; drops react-markdown's `node` prop. */
function styled<T extends ElementType>(Tag: T, base: string) {
  function Styled({ node, className, ...props }: ComponentPropsWithoutRef<T> & ExtraProps) {
    void node
    const Element = Tag as ElementType
    return <Element className={cn(base, className)} {...props} />
  }
  return Styled
}

function Link({ node, href, ...props }: ComponentPropsWithoutRef<"a"> & ExtraProps) {
  void node
  const external = href?.startsWith("http")
  return (
    <a
      href={href}
      className="font-medium text-brand underline underline-offset-2 hover:no-underline"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  )
}

const components: Components = {
  h1: styled("h2", "mt-10 mb-3 text-2xl font-bold first:mt-0"),
  h2: styled("h2", "mt-10 mb-3 text-2xl font-bold first:mt-0"),
  h3: styled("h3", "mt-8 mb-2 text-lg font-bold first:mt-0"),
  p: styled("p", "my-4 leading-relaxed first:mt-0 last:mb-0"),
  ul: styled("ul", "my-4 list-disc space-y-1.5 pl-6 marker:text-brand"),
  ol: styled("ol", "my-4 list-decimal space-y-1.5 pl-6 marker:text-brand"),
  li: styled("li", "pl-1 leading-relaxed"),
  a: Link,
  blockquote: styled("blockquote", "my-6 border-l-4 border-brand bg-brand-soft/60 py-3 pr-4 pl-5 italic"),
  code: styled("code", "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]"),
  pre: styled(
    "pre",
    "my-6 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-white [&_code]:bg-transparent [&_code]:p-0"
  ),
  hr: styled("hr", "my-8 border-border"),
  img: () => null,
}

export function MarkdownArticle({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-[15px] text-foreground md:text-base", className)}>
      <Markdown components={components}>{children}</Markdown>
    </div>
  )
}
