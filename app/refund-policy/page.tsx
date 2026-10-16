import type { Metadata } from 'next'
import { cms } from '@/lib/cms'
import { renderMd } from '@/lib/md-render'
import { PolicyLayout } from '@/app/_components/PolicyLayout'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'GYN is committed to delivering an exceptional experience for all conference delegates. This page outlines our refund policy and credit voucher conditions.',
}

export default async function RefundPolicyPage() {
  const { meta, body } = await cms.getPage('refund-policy')
  const { html, toc } = renderMd(body)
  const lastUpdated = meta.lastModified
    ? new Date(meta.lastModified as string).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <PolicyLayout title="Refund Policy" toc={toc} lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </PolicyLayout>
  )
}
