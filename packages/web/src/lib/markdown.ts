/**
 * Lightweight markdown → sanitized HTML renderer for the admin dashboard.
 * Uses a line-by-line approach (not whole-text regex) so block elements
 * like headings never accumulate extra <br> spacing artifacts.
 *
 * Safe with dangerouslySetInnerHTML — all user content is HTML-escaped
 * inside escapeHtml() before any pattern substitution runs.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Apply inline formatting (bold, italic, code, links) to an
 * already HTML-escaped string.
 */
function applyInline(escaped: string): string {
  let s = escaped
  // Bold: **text** or __text__
  s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  s = s.replace(/__(.*?)__/g, "<strong>$1</strong>")
  // Italic: *text* or _text_ (no newline crossing)
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
  s = s.replace(/_([^_\n]+)_/g, "<em>$1</em>")
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
  // Links
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
  )
  return s
}

export function renderMarkdown(rawText: string): string {
  if (!rawText) return ""

  const lines = rawText.split("\n")
  const output: string[] = []

  for (const line of lines) {
    let m: RegExpMatchArray | null

    // Headings — most specific (#######) first to avoid partial matches
    if ((m = line.match(/^######\s+(.+)$/))) {
      output.push(`<div class="md-h6">${applyInline(escapeHtml(m[1]))}</div>`)
    } else if ((m = line.match(/^#####\s+(.+)$/))) {
      output.push(`<div class="md-h5">${applyInline(escapeHtml(m[1]))}</div>`)
    } else if ((m = line.match(/^####\s+(.+)$/))) {
      output.push(`<div class="md-h4">${applyInline(escapeHtml(m[1]))}</div>`)
    } else if ((m = line.match(/^###\s+(.+)$/))) {
      output.push(`<div class="md-h3">${applyInline(escapeHtml(m[1]))}</div>`)
    } else if ((m = line.match(/^##\s+(.+)$/))) {
      output.push(`<div class="md-h2">${applyInline(escapeHtml(m[1]))}</div>`)
    } else if ((m = line.match(/^#\s+(.+)$/))) {
      output.push(`<div class="md-h1">${applyInline(escapeHtml(m[1]))}</div>`)

    // Horizontal rule
    } else if (/^[-*]{3,}$/.test(line)) {
      output.push(`<hr class="md-hr">`)

    // Ordered list item: "1. text"
    } else if ((m = line.match(/^(\d+)\.\s+(.+)$/))) {
      output.push(
        `<div class="md-ol-item">` +
          `<span class="md-ol-num">${m[1]}.</span>` +
          `\u00a0${applyInline(escapeHtml(m[2]))}` +
        `</div>`
      )

    // Unordered list item: "- text" or "* text"
    } else if ((m = line.match(/^[-*]\s+(.+)$/))) {
      output.push(`<div class="md-li">\u2022\u00a0${applyInline(escapeHtml(m[1]))}</div>`)

    // Empty line — renders as a small visual gap
    } else if (line.trim() === "") {
      output.push(`<div class="md-empty"></div>`)

    // Regular paragraph line
    } else {
      output.push(`<div class="md-p">${applyInline(escapeHtml(line))}</div>`)
    }
  }

  return output.join("")
}
