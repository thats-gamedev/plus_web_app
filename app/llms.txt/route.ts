import { llmsTxt } from "@/lib/llms"

// /llms.txt: the site for LLMs and AI assistants, as Markdown (lib/llms.ts).
export async function GET() {
  return new Response(await llmsTxt(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
}
