/**
 * Minimal markdown-to-HTML renderer for the policy page subset:
 * headings (H1–H6), paragraphs, unordered lists, ordered lists,
 * links, bold/strong, tables.
 *
 * shortcut: only handles the constructs present in the three policy files;
 *   not a general-purpose renderer. Upgrade to remark if more pages land.
 *
 * Heading levels are remapped so the page's h1 (the layout's title) is followed by h2, h3, ... with no skipped level:
 * the distinct levels the document uses below its H1 keep their order and become 2, 3, 4 ... A document H1 stays h1.
 * Returns an array of { id, text } for each top remapped level (h2) (used by the sticky TOC) alongside the HTML string.
 */

export interface TocEntry {
  id: string
  text: string
}

export interface RenderResult {
  html: string
  toc: TocEntry[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function renderMd(markdown: string): RenderResult {
  const toc: TocEntry[] = []
  const lines = markdown.split('\n')
  const used = [...new Set(lines.map((l) => /^(#{2,6})\s+\S/.exec(l)?.[1].length ?? 0).filter(Boolean))].sort()
  const out: string[] = []
  let i = 0

  function escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /** Allow only safe URL schemes; drop anything else (e.g. javascript:, data:). */
  function safeHref(raw: string): string {
    // raw has already been HTML-escaped by escape(); unescape for scheme check
    const url = raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    // a leading "//" or "/\" is protocol-relative (another site), not a site path
    if (/^(https?:\/\/|mailto:|tel:|\/(?![\/\\])|#)/i.test(url)) return raw;
    return '#'; // unsupported scheme → harmless anchor
  }

  /** Inline: bold + links */
  function inline(s: string): string {
    return escape(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, href) => `<a href="${safeHref(href)}">${text}</a>`)
  }

  while (i < lines.length) {
    const line = lines[i]

    // H1–H6
    const hMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (hMatch) {
      const written = hMatch[1].length
      const level = written === 1 ? 1 : used.indexOf(written) + 2
      const text = hMatch[2].replace(/\*\*/g, '')
      const id = slugify(text)
      if (level === 2) toc.push({ id, text })
      out.push(`<h${level} id="${id}">${escape(text)}</h${level}>`)
      i++
      continue
    }

    // Table: lines starting with |
    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const [header, separator, ...body] = tableLines
      void separator
      const headers = header.split('|').slice(1, -1).map((c) => c.trim())
      out.push('<table><thead><tr>')
      for (const h of headers) out.push(`<th>${inline(h)}</th>`)
      out.push('</tr></thead><tbody>')
      for (const row of body) {
        const cells = row.split('|').slice(1, -1).map((c) => c.trim())
        out.push('<tr>')
        for (const c of cells) out.push(`<td>${inline(c)}</td>`)
        out.push('</tr>')
      }
      out.push('</tbody></table>')
      continue
    }

    // Unordered list
    if (/^\s*[\*\-]\s/.test(line)) {
      out.push('<ul>')
      while (i < lines.length && /^\s*[\*\-]\s/.test(lines[i])) {
        out.push(`<li>${inline(lines[i].replace(/^\s*[\*\-]\s/, ''))}</li>`)
        i++
      }
      out.push('</ul>')
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      out.push('<ol>')
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        out.push(`<li>${inline(lines[i].replace(/^\d+\.\s/, ''))}</li>`)
        i++
      }
      out.push('</ol>')
      continue
    }

    // HTML comment — skip
    if (line.startsWith('<!--')) {
      while (i < lines.length && !lines[i].includes('-->')) i++
      i++
      continue
    }

    // Blank line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph (collect non-empty, non-special lines)
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('|') &&
      !/^\s*[\*\-]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('<!--')
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length) {
      out.push(`<p>${inline(paraLines.join(' '))}</p>`)
    }
  }

  return { html: out.join('\n'), toc }
}
