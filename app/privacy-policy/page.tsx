import type { Metadata } from 'next'
import { cms } from '@/lib/cms'
import { renderMd } from '@/lib/md-render'
import { PolicyLayout } from '@/app/_components/PolicyLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'The Global Youth Network (GYN) is committed to protecting the privacy and personal information of all visitors, applicants, delegates, partners, and stakeholders.',
}

export default async function PrivacyPolicyPage() {
  const { meta, body } = await cms.getPage('privacy-policy')
  const { html, toc } = renderMd(body)
  const lastUpdated = meta.lastModified
    ? new Date(meta.lastModified as string).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <PolicyLayout title="Privacy Policy" toc={toc} lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </PolicyLayout>
  )
}
