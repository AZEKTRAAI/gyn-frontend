// Transactional email via the Resend REST API.
// When RESEND_API_KEY is set, sends via https://api.resend.com/emails.
// Without it, renders to the server console (demo mode).

const RESEND_API = "https://api.resend.com/emails";

/** Escape HTML special characters before interpolating user-supplied values into email HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export interface RegistrationConfirmationData {
  to: string;
  recipientName: string;
  reference: string;
  ticketName: string;
  amountUsd: string;    // formatted, e.g. "$199.00"
  eventDates: string;   // "19–22 November 2026"
  venue: string;
  refundPolicyUrl: string;
}

function confirmationHtml(d: RegistrationConfirmationData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Registration Confirmed – ${esc(d.reference)}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h1 style="color:#202F60">You're registered for SISM 2026!</h1>
  <p>Hi ${esc(d.recipientName)},</p>
  <p>Your registration for the <strong>SDG Innovation Summit Malaysia 2026</strong> has been confirmed.</p>
  <table style="border-collapse:collapse;width:100%;margin:24px 0">
    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Reference</td><td style="padding:8px;border:1px solid #ddd">${esc(d.reference)}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Ticket</td><td style="padding:8px;border:1px solid #ddd">${esc(d.ticketName)}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Amount paid</td><td style="padding:8px;border:1px solid #ddd">${esc(d.amountUsd)}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Dates</td><td style="padding:8px;border:1px solid #ddd">${esc(d.eventDates)}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Venue</td><td style="padding:8px;border:1px solid #ddd">${esc(d.venue)}</td></tr>
  </table>
  <h2 style="color:#202F60">What happens next?</h2>
  <ul>
    <li>You will receive a detailed programme schedule closer to the event.</li>
    <li>Accommodation details and logistics will be sent 4–6 weeks before the summit.</li>
    <li>Join our delegate WhatsApp group via the link in a follow-up email.</li>
    <li>If you purchased an Invitation Letter ticket, your letter will be prepared and sent within 3 business days.</li>
  </ul>
  <p><strong>Refund policy:</strong> Please review our <a href="${esc(d.refundPolicyUrl)}">refund policy</a>. All approved refunds are issued as GYN Credit Vouchers.</p>
  <p style="color:#666;font-size:12px">Questions? Email us at events@thegyn.org. Include your reference number: <strong>${esc(d.reference)}</strong>.</p>
  <p style="color:#666;font-size:12px">GYN – Global Youth Network | thegyn.org</p>
</body>
</html>`;
}

function confirmationText(d: RegistrationConfirmationData): string {
  return `You're registered for SISM 2026!

Hi ${d.recipientName},

Your registration has been confirmed.

Reference: ${d.reference}
Ticket: ${d.ticketName}
Amount paid: ${d.amountUsd}
Dates: ${d.eventDates}
Venue: ${d.venue}

What happens next?
- You will receive a detailed programme schedule closer to the event.
- Accommodation details and logistics will be sent 4-6 weeks before the summit.
- Join our delegate WhatsApp group via the link in a follow-up email.
- If you purchased an Invitation Letter ticket, your letter will be prepared and sent within 3 business days.

Refund policy: ${d.refundPolicyUrl}

Questions? Email events@thegyn.org with reference: ${d.reference}

GYN – Global Youth Network | thegyn.org`;
}

export async function sendRegistrationConfirmation(
  data: RegistrationConfirmationData
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "GYN Events <events@thegyn.org>";

  const payload = {
    from,
    to: [data.to],
    subject: `Registration confirmed – ${data.reference} | SISM 2026`,
    html: confirmationHtml(data),
    text: confirmationText(data),
  };

  if (!apiKey) {
    // Demo mode: log to console instead of sending.
    console.log({
      msg: "email: RESEND_API_KEY not set; would send email",
      to: data.to,
      subject: payload.subject,
      reference: data.reference,
    });
    console.log("--- EMAIL TEXT BODY ---\n" + payload.text + "\n---");
    return;
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}
