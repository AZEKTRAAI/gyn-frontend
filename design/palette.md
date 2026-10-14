# GYN palette

Derived from the logo (`design/logo/gyn-logo.png`), not from the current site. The live site's neon yellow `#FEFF00` doesn't appear anywhere in the logo, and as text on white it scores **1.08:1**, which fails every WCAG level. It's gone.

## Logo source colours (pixel-counted)

| Logo element | Hex | Share of coloured pixels |
|---|---|---|
| Wordmark "Global Youth Network" | `#202F60` | 54% |
| Hand 1 + "EMPOWERING YOUTH" | `#C52035` | 17% |
| Hand 2 | `#EF3F2D` | 9% |
| Hand 3 | `#F2692C` | 9% |
| Hand 4 | `#48783F` | 9% |
| Centre | UN SDG wheel (17 official colours) | — |

## Scales

| Token | Hex | Use |
|---|---|---|
| `navy-900` | `#0E1530` | Dark-mode background, deepest ink |
| `navy-800` | `#16204A` | Dark-mode surface |
| `navy-700` | `#202F60` | **Primary.** Headlines, primary buttons (light mode) |
| `navy-500` | `#3A4C8C` | Hover / links on light |
| `navy-300` | `#8E9BCB` | Muted text on dark |
| `navy-100` | `#E3E7F4` | Tinted surfaces |
| `crimson-600` | `#C52035` | **Secondary.** CTAs, highlights |
| `crimson-500` | `#E0334A` | Hover |
| `crimson-300` | `#F28C9A` | Crimson text on dark |
| `flame-500` | `#EF3F2D` | Decorative only (gradients, illustration) |
| `ember-600` | `#C9501A` | Orange text / button fill with white text |
| `ember-500` | `#F2692C` | **Accent.** Fills with navy-900 text, highlights on dark |
| `ember-300` | `#F9A77E` | Orange text on dark |
| `leaf-600` | `#48783F` | Success, SDG/climate accents |
| `leaf-500` | `#5E9A52` | Hover |
| `leaf-300` | `#9FCB94` | Green text on dark |

Neutrals are warm-grey (paper, not slate) so the page doesn't read as generic SaaS:

| `n-0` `#FFFFFF` | `n-50` `#F7F7F4` | `n-100` `#EEEEE9` | `n-200` `#DCDCD5` | `n-300` `#BDBDB5` | `n-400` `#9A9A93` | `n-500` `#76766F` | `n-600` `#5A5A55` | `n-700` `#3F3F3C` | `n-800` `#262624` | `n-900` `#141413` |
|---|---|---|---|---|---|---|---|---|---|---|

Semantic: success `leaf-600`, warning `ember-600`, error `crimson-600`, info `navy-500`.

## SDG accents

SDG 4 `#C5192D`, SDG 5 `#FF3A21`, SDG 9 `#FD6925`, SDG 13 `#3F7E44` (official UN values). GYN's four focus goals happen to sit almost exactly on the logo's hand colours, so the focus-area cards can use them without breaking the palette.

## Contrast checks (WCAG 2.2)

| Pair | Ratio | Result |
|---|---|---|
| navy-700 on white | 12.83 | AAA |
| navy-700 on n-50 | 11.95 | AAA |
| crimson-600 on white | 5.78 | AA |
| white on crimson-600 (button) | 5.78 | AA |
| ember-500 on white | 3.07 | **large text only** — never body text |
| ember-600 on white / white on ember-600 | 4.52 | AA |
| navy-900 on ember-500 (button) | 5.85 | AA |
| leaf-600 on white | 5.21 | AA |
| n-600 on white (body secondary) | 6.93 | AA |
| n-500 on white | 4.57 | AA (n-500 on n-50 is 4.26, large only) |
| white on navy-900 | 17.97 | AAA |
| n-300 on navy-900 | 9.51 | AAA |
| navy-300 on navy-900 | 6.59 | AA |
| crimson-300 / ember-300 / leaf-300 on navy-900 | 7.7 / 9.3 / 9.8 | AAA |
| crimson-500 on navy-900 | 4.06 | large text only |
| *current site:* `#FEFF00` on white | **1.08** | **FAIL** |

Rules that fall out of this:
- Orange is never body text on light. Use `ember-600` or put navy-900 on an ember-500 fill.
- On dark, colour text uses the `-300` steps.
- Script: `design/contrast.py` reproduces every number above.

CSS variables: `design/tokens/tokens.css`.
