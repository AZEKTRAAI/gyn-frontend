import { cms } from '@/lib/cms'
import { renderMd } from '@/lib/md-render'
import { PolicyLayout } from './PolicyLayout'

/** A policy page: the markdown page `slug` inside the policy layout. */
export async function PolicyPage({ slug, title }: { slug: string; title: string }) {
  const { meta, body } = await cms.getPage(slug)
  const { html, toc } = renderMd(body)
  const lastUpdated = meta.lastModified
    ? new Date(meta.lastModified as string).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <PolicyLayout title={title} toc={toc} lastUpdated={lastUpdated}>
      {/* the page title is already in the royal box, so the markdown's own first H1 is dropped */}
      <div dangerouslySetInnerHTML={{ __html: html.replace(/^<h1 [^>]*>.*?<\/h1>\n?/, '') }} />
    </PolicyLayout>
  )
}
