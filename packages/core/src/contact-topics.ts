// The one list of contact form topics. No imports, so the client-side form can use it without pulling in the database client.
// Re-exported from contact-store.ts; the website form, its server check, the contact page and the admin all read it.

export const CONTACT_TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "partnership", label: "Partnership" },
  { value: "group-booking", label: "Group booking" },
  { value: "media", label: "Media" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];
/** For z.enum(): the values as a non-empty tuple. */
export const CONTACT_TOPIC_VALUES = CONTACT_TOPICS.map((t) => t.value) as unknown as readonly [ContactTopic, ...ContactTopic[]];
export const isContactTopic = (v: unknown): v is ContactTopic => CONTACT_TOPICS.some((t) => t.value === v);
