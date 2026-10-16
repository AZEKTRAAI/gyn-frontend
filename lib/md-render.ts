/**
 * Minimal markdown-to-HTML renderer for the policy page subset:
 * headings (H1–H6), paragraphs, unordered lists, ordered lists,
 * links, bold/strong, tables.
 *
 * shortcut: only handles the constructs present in the three policy files;
 *   not a general-purpose renderer. Upgrade to remark if more pages land.
 *
 * Returns an array of { id, level, text } for each H2 (used by the sticky TOC)
 * alongside the HTML string.
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
  const out: string[] = []
  let i = 0

  function escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /** Allow only safe URL schemes; drop anything else (e.g. javascript:, data:). */
  function safeHref(raw: string): string {
    // raw has already been HTML-escaped by escape(); unescape for scheme check
    const url = raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url)) return raw;
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
      const level = hMatch[1].length
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
