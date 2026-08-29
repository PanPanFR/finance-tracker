# Outstanding Audit Items — AI Finance Tracker

**Original audit:** 2026-08-25 · https://tracker.panpan.my.id
**Re-verified against code:** 2026-08-27 (removed items already fixed as of commit `b5da017`)
**Fix pass:** 2026-08-29 — all remaining items addressed (see RESOLVED).

---

## OPEN ITEMS

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 20 | Low | No CSP nonce for inline scripts (theme init uses `dangerouslySetInnerHTML`, `layout.tsx`). **Deferred** — same rationale as item 7: CSP currently allows `script-src 'unsafe-inline'`, so a nonce adds no security until `unsafe-inline` is removed. The theme script must run pre-paint to avoid FOUC; externalizing it reintroduces the flash. Re-evaluate together with Trusted Types when CSP is tightened. |

---

## RESOLVED (fixed since 2026-08-25 audit)

| # | Issue | Status |
|---|-------|--------|
| 1 | No Content Security Policy (CSP) header | ✅ `next.config.ts` — full CSP: `default-src 'self'`, `script-src`, `style-src`, `connect-src`, `img-src`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` |
| 2 | No HSTS header | ✅ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| 3 | No X-Frame-Options / frame-ancestors | ✅ `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| 4 | Color contrast failures (WCAG AA 1.4.3) | ✅ (a) `--color-primary` bumped `#6366f1` → `#5b5bd6` — white button text now 5.37:1 (both themes). (b) New `--color-primary-text` token (`#818cf8` dark / `#4338ca` light) applied to "View All Records" link (5.94:1 on `#18181b`) and `.mobile-tab-item.active` (6.22:1). Verified by computed WCAG ratios. |
| 5 | `aria-hidden="true"` sidebar contains focusable buttons (Lighthouse `aria-hidden-focus`) | ✅ `Navigation.tsx` — `inert={!isSidebarOpen}` on the drawer `<aside>` (React 19 boolean prop); whole subtree unfocusable when closed |
| 6 | No COOP header | ✅ `Cross-Origin-Opener-Policy: same-origin` |
| 7 | No Trusted Types directive | ⚠️ Deferred — re-evaluate when CSP is tightened (see item 20) |
| 8 | Rate limiter uses in-memory `Map` (resets on cold start) | ✅ `api/ai/parse/route.ts` — D1-backed atomic upsert (`rate_limits` table: expired window resets, else increments, `RETURNING count`); fails open if D1 unavailable. Table created on remote D1 (`wrangler d1 execute`) and added to `schema.sql`. |
| 9 | Gemini API key leaked in URL query string | ✅ Migrated to 9router (`src/lib/ai.ts`) — key now in `Authorization: Bearer` header |
| 10 | Input not sanitized before AI prompt | ✅ System prompt guard + response schema validation |
| 11 | OCR worker not terminated on error path | ✅ `src/lib/ocr.ts` — worker handle tracked; `finally` terminates it even when `setParameters`/`recognize` throw; `terminate()` failure swallowed so it can't mask the original error |
| 12 | CSV export formula injection | ✅ `sanitizeCsvValue()` applied to all exported cells |
| 13 | No `rel="noopener noreferrer"` on external links | ✅ No `target="_blank"` links found in `src/` — N/A |
| 14 | Session cookie `sameSite: "lax"` with double-submit CSRF | ✅ Changed to `sameSite: "strict"` (`api/auth/login/route.ts`) — no cross-site POST needs |
| 15 | No `Permissions-Policy` header | ✅ `camera=(), microphone=(), geolocation=()` |
| 16 | No `X-Content-Type-Options: nosniff` | ✅ Added |
| 17 | Light theme color contrast not verified | ✅ Verified via computed WCAG ratios (Lighthouse light-mode run unnecessary): all light-theme text tokens pass AA — `#55555f`/`#f6f6f8` 6.82:1, `#3f3f49` 9.64:1, `#6d6d78` 4.74:1, `#4338ca` 7.32:1, `#047857` 5.08:1, `#be123c` 5.82:1. (Audit's "≈4.8:1 borderline" estimate was low; actual 6.82:1.) |
| 18 | Tesseract.js ~2MB in client bundle | ✅ `ai-copilot/page.tsx` — static import removed; `await import("../../lib/ocr")` inside `handleFileUpload`, loaded only on first receipt scan |
| 19 | `console.log` leaking internal data in production | ✅ Both `console.log` calls removed from `src/lib/aiParser.ts` (error-path `console.error` retained) |
| 21 | `GOOGLE_API_KEY` baked into bundle at build time | ✅ Build-time env removed from `.github/workflows/deploy.yml`; key read at runtime from Cloudflare request context (`getAiConfig(env)`). **Action required:** set `AI_API_KEY` (or legacy `GOOGLE_API_KEY`) in Cloudflare Pages → Settings → Environment Variables. |

---

**End of Report**
