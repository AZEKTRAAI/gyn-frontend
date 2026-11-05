// What each admin role may do (SRS section 7). Code checks permissions by name, never by role name,
// and the Super Administrator can edit a role's permissions from the admin (phase 3 follow-up).

export const PERMISSIONS = [
  "dashboard.view",
  "events.view",
  "events.manage",
  "forms.view",
  "forms.manage",
  "forms.publish",
  "registrations.view",
  "registrations.view_sensitive", // passport numbers, dates of birth, documents
  "registrations.edit",
  "registrations.export",
  "applications.view", // the incoming-applications review panel
  "applications.decide", // accept, waitlist, reject
  "applications.send_email", // send the personalised acceptance email from the panel
  "payments.view",
  "payments.refund",
  "payments.manual_adjust",
  "reports.view",
  "reports.export",
  "letters.manage",
  "emails.manage",
  "media.manage",
  "pages.manage",
  "home.edit",
  "seo.manage",
  "contact.view",
  "users.manage",
  "settings.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface RoleSeed {
  name: string;
  description: string;
  permissions: Array<Permission | "*">;
}

export const ROLES: RoleSeed[] = [
  { name: "Super Administrator", description: "Complete system access. Creates users, assigns roles, edits permissions.", permissions: ["*"] },
  {
    name: "Event Manager",
    description: "Creates and manages events, their pages, categories and media.",
    permissions: ["dashboard.view", "events.view", "events.manage", "forms.view", "media.manage", "registrations.view", "reports.view"],
  },
  {
    name: "Registration Manager",
    description: "Manages participant registrations, the review panel, and forms.",
    permissions: [
      "dashboard.view", "events.view", "forms.view", "forms.manage", "forms.publish",
      "registrations.view", "registrations.view_sensitive", "registrations.edit", "registrations.export",
      "applications.view", "applications.decide", "applications.send_email",
      "letters.manage", "emails.manage", "reports.view",
    ],
  },
  {
    name: "Finance Manager",
    description: "Views transactions and financial reports; issues refunds.",
    permissions: ["dashboard.view", "registrations.view", "payments.view", "payments.refund", "payments.manual_adjust", "reports.view", "reports.export"],
  },
  {
    name: "Content Manager",
    description: "Manages pages, the home page, media and SEO.",
    permissions: ["dashboard.view", "pages.manage", "home.edit", "media.manage", "seo.manage", "contact.view", "events.view"],
  },
  {
    name: "Viewer",
    description: "Read-only access to authorised records and reports. Sensitive fields stay hidden.",
    permissions: ["dashboard.view", "events.view", "forms.view", "registrations.view", "reports.view"],
  },
];

/** True when the granted list covers the needed permission. "*" grants everything. */
export function can(granted: readonly string[], needed: Permission): boolean {
  return granted.includes("*") || granted.includes(needed);
}
