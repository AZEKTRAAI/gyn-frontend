# Decisions log

Newest at the bottom. Each entry: what, why, reversible?

## 2026-10-15

**D1. Design directions before any build.** Asked for explicitly: we show the team several design directions and pick one before Phase 2. Phase 2 (Next.js build) is gated on that choice. Reversible.

**D2. Palette comes from the logo, not the current site.** Logo is navy `#202F60` + crimson/flame/ember/leaf hands. The site's `#FEFF00` yellow isn't in the logo and fails contrast at 1.08:1. See `design/palette.md`. Reversible.

**D3. Warm-grey neutrals.** Paper-toned, not slate, so the site doesn't read as generic SaaS. Reversible.

**D4. Agent substitutions.** No `research-analyst` agent in the pack, so `design-revamp-specialist` does benchmark research. The crawl uses a `general-purpose` agent with Firecrawl (no doc-extraction pack installed).

**D5. Skill substitutions.** `frontend-design` isn't installed; using `design-taste-frontend` (taste-skill), `impeccable` and `emil-design-eng` instead. `theme-factory` is present only as a synced copy; palette done by hand from pixel counts plus contrast script. `deep-research` is used via the research agent. Playwright MCP failed to connect this session, so screenshots come from Firecrawl.

**D6. Attribution.** Per Azam's instruction, no `Co-Authored-By: Claude`, `Claude-Session:` or "Generated with Claude Code" on any commit or PR.

**D7. Deadline reality check.** SISM 2026 applications closed 11 Oct 2026, results on 16 Oct. Event is 19–22 Nov. The scholarship tiers say "CLOSED NOW"; Forum Access / Self-Funded / Invitation Letter still show "Register now". Prototypes reflect that state rather than pretending applications are open.
