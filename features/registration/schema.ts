import { z } from "zod";

// Prices live here, on the server side of the contract. The client never sends a price.
export const TICKETS = {
  "forum-access": { eventId: "sism-2026", name: "Forum Access (confirmed seat)", amountCents: 19900, form: "attendee" },
  "self-funded": { eventId: "sism-2026", name: "Self Funded (confirmed seat with accommodation)", amountCents: 39900, form: "attendee" },
  "invitation-letter": { eventId: "sism-2026", name: "Invitation Letter", amountCents: 4900, form: "invitation" },
} as const;
export type TicketId = keyof typeof TICKETS;
export const TICKET_IDS = Object.keys(TICKETS) as TicketId[];

// The live form lists sexual orientations as genders; these replace them (see docs/DECISIONS.md).
export const GENDERS = ["Female", "Male", "Another gender", "Prefer not to say"] as const;
export const HEARD_FROM = ["Social Media", "Google", "Word of Mouth", "Refer a Friend", "Past Participant", "Other"] as const;

const name = z.string().trim().min(2, "Enter your full name").max(120).regex(/^[^<>]*$/, "Name must not contain < or >");
const email = z.email("Enter a valid email address").trim().max(254);
const country = z.string().trim().min(2, "Choose a country").max(80);
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter the number with country code, e.g. +60 12 345 6789");

export const attendeeSchema = z.object({
  fullName: name,
  email,
  nationality: country,
  countryOfResidence: country,
  whatsapp: phone,
  gender: z.enum(GENDERS, "Choose an option"),
  // the select's placeholder submits "", which means "not answered", not an invalid choice
  heardFrom: z.enum([...HEARD_FROM, ""]).optional(),
});

// Passport numbers are used to issue the letter and must not be stored afterwards (docs/schema.md, PII section).
export const invitationSchema = z.object({
  fullName: name,
  email,
  contactNumber: phone,
  passportNumber: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,12}$/, "Passport numbers are 6 to 12 letters and digits"),
  nationality: country,
});

const consent = z.literal(true, "You need to agree to the Terms and Conditions");
const turnstileToken = z.string().max(4096).optional();

export const registrationInput = z.discriminatedUnion("ticket", [
  z.object({ ticket: z.literal("forum-access"), details: attendeeSchema, consent, turnstileToken }),
  z.object({ ticket: z.literal("self-funded"), details: attendeeSchema, consent, turnstileToken }),
  z.object({ ticket: z.literal("invitation-letter"), details: invitationSchema, consent, turnstileToken }),
]);
export type RegistrationInput = z.infer<typeof registrationInput>;
