import { Firecrawl } from "firecrawl"

export interface ScrapedContent {
  markdown: string
  title?: string
  description?: string
  url: string
}

export interface ScrapeOptions {
  apiKey?: string
  timeoutMs?: number
}

/**
 * Scrapes a public URL and converts its content into clean, LLM-ready markdown using the Firecrawl SDK.
 */
export async function scrapeUrl(
  url: string,
  options?: ScrapeOptions
): Promise<ScrapedContent> {
  const apiKey = options?.apiKey ?? process.env.FIRECRAWL_API_KEY

  const firecrawl = new Firecrawl(apiKey ? { apiKey } : undefined)

  const doc = await firecrawl.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
    timeout: options?.timeoutMs ?? 30000,
  })

  const markdown = doc.markdown || ""
  const title = doc.metadata?.title
  const description = doc.metadata?.description

  return {
    markdown,
    title,
    description,
    url,
  }
}
