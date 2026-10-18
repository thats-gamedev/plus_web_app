"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type Props = React.ComponentProps<typeof Link> & { href: `/#${string}` }

/**
 * A link to a section of the landing page ("/#pricing"). next/link ignores a
 * click when the URL already ends in that hash (after the first click, say),
 * so on the landing page this scrolls to the section itself, every time.
 * Elsewhere it's a normal link to the landing page.
 */
export function SectionLink({ href, onClick, ...props }: Props) {
  const pathname = usePathname()
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        const hash = href.slice(1)
        const section = document.getElementById(hash.slice(1))
        if (!section) return
        e.preventDefault()
        if (window.location.hash !== hash) window.history.pushState(null, "", hash)
        // An open menu sheet locks scrolling until it has closed: wait for that.
        const scroll = () => section.scrollIntoView()
        if (!document.body.hasAttribute("data-scroll-locked")) return scroll()
        const unlocked = new MutationObserver(() => {
          if (document.body.hasAttribute("data-scroll-locked")) return
          unlocked.disconnect()
          scroll()
        })
        unlocked.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] })
      }}
      {...props}
    />
  )
}
