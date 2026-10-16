// Pure contact form handler — factored out of the route for testability.

import { z } from "zod";
import type { Repo } from "@/lib/server/repo.ts";

export const contactInput = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email address").trim().max(254),
  topic: z.enum(["general", "partnership", "group-booking", "media"], "Choose a topic"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be under 2000 characters"),
  turnstileToken: z.string().max(4096).optional(),
  // honeypot
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactInput>;

export type ContactResult =
  | { ok: true }
  | { ok: false; status: 400; fieldErrors: Record<string, string[]> }
  | { ok: false; status: 429; error: string }
  | { ok: false; status: 500; error: string };

export async function handleContact(
  rawBody: unknown,
  rateLimitAllowed: boolean,
  repo: Repo
): Promise<ContactResult> {
  if (!rateLimitAllowed) {
    return { ok: false, status: 429, error: "Too many requests. Please wait a few minutes and try again." };
  }

  const parsed = contactInput.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "form";
      (fieldErrors[path] ??= []).push(issue.message);
    }
    return { ok: false, status: 400, fieldErrors };
  }

  const { name, email, topic, message, website } = parsed.data;

  // Honeypot check after parse
  if (website && website.length > 0) {
    return { ok: false, status: 400, fieldErrors: { form: ["Invalid submission."] } };
  }

  try {
    await repo.saveContactSubmission({ name, email, topic, message });
  } catch (err) {
    console.error({ msg: "contact: failed to save submission", error: String(err) });
    return { ok: false, status: 500, error: "Could not save your message. Please try again." };
  }

  return { ok: true };
}
