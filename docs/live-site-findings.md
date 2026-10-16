# thegyn.org: what's broken today, with evidence

These are the only live-site problems we state in the pitch, on the design-directions page and on `/pitch`. Each one points at where we saw it. The crawl ran on 15 Oct 2026; item 4's pixel values were re-checked against the live HTML on 16 Oct.

| # | Problem | Evidence |
|---|---|---|
| 1 | The brand yellow `#FEFF00` on white is 1.08:1. WCAG AA needs 4.5:1 for text. It isn't in the logo either. | `design/palette.md` (computed with `design/contrast.py`); logo pixel count in the same file |
| 2 | Both countdowns expired on 11 Oct and show 00:00:00:00, while the home "APPLY NOW" button still links to the summit page. | `content/pages/home.md` crawl note (line ~251), `content/pages/sism-2026.md` crawl note (line ~442) |
| 3 | The SISM hero's "APPLY NOW" jumps to the scholarship section, where both cards now say "CLOSED NOW". Applicants follow the call to action into a dead end. | `content/pages/sism-2026.md` crawl notes (lines ~442–443). The CLOSED NOW labels themselves are not links. |
| 4 | Forum Access has three prices: $199 on the page, $249 sent to the Meta Pixel as the lead value, and $170 on an unlinked "discounted" form with no CAPTCHA. Self Funded is likewise $399 on the page and $449 in the pixel. | Page price: `content/pages/sism-2026.md`. Pixel: live HTML of /sism-2026/, `fbq('track', 'Lead', { value: 249 … })` for form ID 9 and $449 for Self Funded. Hidden form: `content/pages/sism-2026-application-form.md` notes (lines ~74, ~80) |
| 5 | The scholarship results date is 16 Oct in the FAQ and 15 Oct on the thank-you page. | `content/pages/sism-2026.md` line ~398; `content/pages/thank-you-page.md` lines 12 and 25 |
| 6 | Five benefit items link to a broken address (`http://i%20class=fa-solid…`), all four contact-page background images return 404, and two FMS speaker photos return 404. | `content/pages/sism-2026.md` note (line ~444); `content/pages/contact-us.md` note (line ~49); `content/pages/fms-thailand.md` note (line ~217) |
| 7 | Nine videos sit in default YouTube iframes with no filtering, deep links or shared player. | `content/media.json` (9 videos); crawl of /sism-2026/ and /fms-thailand/ |
| 8 | Typos on the pages that take money: "PARTIALLY SCHOLARSHIP", "Patronas Twin Tower", "Al" for AI, and a gender field listing sexual orientations, one misspelled ("Hetrosexual"). | `content/pages/sism-2026.md` lines 88, 141, 340 and note (line ~449); `content/pages/sism-forum-access.md` lines 43–45 |

## Corrected on 16 Oct
An earlier version of item 3 said the closed scholarship cards had live Apply buttons next to them. The crawl shows the CLOSED NOW labels are not links; the real problem is the hero button leading into the closed section. The design-directions page, `/pitch` and `docs/pitch.md` were updated.
