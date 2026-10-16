import type { Metadata } from 'next'
import { cms } from '@/lib/cms'
import { renderMd } from '@/lib/md-render'
import { PolicyLayout } from '@/app/_components/PolicyLayout'

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'By using the Global Youth Network website or participating in any programs organized by the Global Youth Network, you agree to these terms.',
}

export default async function TermsConditionsPage() {
  const { meta, body } = await cms.getPage('terms-conditions')
  const { html, toc } = renderMd(body)
  const lastUpdated = meta.lastModified
    ? new Date(meta.lastModified as string).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <PolicyLayout title="Terms and Conditions" toc={toc} lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </PolicyLayout>
  )
}
