// Pure ICS builder — no Next.js dependency; importable directly by Node tests.
// RFC 5545 requires CRLF line endings.

export const SISM_2026_UID = "sism-2026@thegyn.org";

export function buildSism2026Ics(): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GYN//SISM 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${SISM_2026_UID}`,
    "DTSTAMP:20261016T000000Z",
    "DTSTART;TZID=Asia/Kuala_Lumpur:20261119T090000",
    "DTEND;TZID=Asia/Kuala_Lumpur:20261122T180000",
    "SUMMARY:SISM 2026 – 9th Student International Summit in Medicine",
    "DESCRIPTION:The 9th Student International Summit in Medicine (SISM 2026)." +
      " Forum Access and Self-Funded delegates only. Invitation Letter holders " +
      "attend subject to visa approval. See https://thegyn.org/sism-2026 for details.",
    "LOCATION:Teedo Hotel\\, Kuala Lumpur\\, Malaysia",
    "URL:https://thegyn.org/sism-2026",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
