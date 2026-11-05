// The admin menu. A person only sees the modules their role has the permission for.
// `built: false` modules show a "coming" page that says which phase of docs/backend-plan.md delivers them.
import type { Permission } from '@gyn/core/permissions'

export interface AdminModule {
  slug: string
  href: string
  label: string
  permission: Permission
  built: boolean
  phase?: number
  about?: string
}

export const MODULES: AdminModule[] = [
  { slug: '', href: '/', label: 'Dashboard', permission: 'dashboard.view', built: true },
  { slug: 'applications', href: '/applications', label: 'Incoming applications', permission: 'applications.view', built: false, phase: 6, about: 'The review queue for scholarship and other reviewed applications: accept, waitlist or reject, then send the personalised email to the person.' },
  { slug: 'registrations', href: '/registrations', label: 'Registrations', permission: 'registrations.view', built: false, phase: 6, about: 'Every registration across all events and forms: search, filter, open a full record, edit, export.' },
  { slug: 'forms', href: '/forms', label: 'Forms', permission: 'forms.view', built: false, phase: 5, about: 'Create and edit unlimited registration forms with drag and drop, conditions and versions.' },
  { slug: 'events', href: '/events', label: 'Events', permission: 'events.view', built: false, phase: 4, about: 'Create events, their pages and registration categories. Upcoming and past events sort themselves by date.' },
  { slug: 'payments', href: '/payments', label: 'Payments', permission: 'payments.view', built: false, phase: 7, about: 'Stripe and PayPal payments, refunds and reconciliation.' },
  { slug: 'letters', href: '/letters', label: 'Letters and emails', permission: 'letters.manage', built: false, phase: 8, about: 'Letter and email templates, the delivery log, resend and regenerate.' },
  { slug: 'reports', href: '/reports', label: 'Reports', permission: 'reports.view', built: false, phase: 9, about: 'Registration and financial reports with Excel, CSV and PDF export.' },
  { slug: 'media', href: '/media-library', label: 'Media', permission: 'media.manage', built: false, phase: 10, about: 'Photos, banners, videos and galleries.' },
  { slug: 'home', href: '/home', label: 'Home page', permission: 'home.edit', built: true },
  { slug: 'pages', href: '/pages', label: 'Pages and SEO', permission: 'pages.manage', built: false, phase: 10, about: 'About, Contact and policy pages, plus SEO settings.' },
  { slug: 'contact', href: '/contact', label: 'Contact inbox', permission: 'contact.view', built: false, phase: 10, about: 'Messages sent through the website contact form.' },
  { slug: 'users', href: '/users', label: 'Users and roles', permission: 'users.manage', built: false, phase: 3, about: 'Create admin users, assign roles and edit what each role may do.' },
  { slug: 'audit', href: '/audit', label: 'Audit log', permission: 'audit.view', built: false, phase: 3, about: 'Who changed what and when.' },
]
