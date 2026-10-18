import { llmsFullTxt } from "@/lib/llms"

// /llms-full.txt: all public content in one Markdown file (lib/llms.ts).
export async function GET() {
  return new Response(await llmsFullTxt(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
}
