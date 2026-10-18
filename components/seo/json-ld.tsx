/**
 * Structured data (schema.org JSON-LD) for search engines and LLMs. "<" is
 * escaped so a string in the data can't close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
