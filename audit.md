## Comprehensive Web Audit Report — AI Finance Tracker

**Audited:** 2026-08-25  
**URL:** https://tracker.panpan.my.id  
**Project:** `finance-tracker` (Next.js 15 + React 19 + Tailwind CSS + Cloudflare D1)  
**Lighthouse Version:** 13.4.1  
**Scope:** Full production audit — security, accessibility (WCAG), performance, code quality, best practices.

---

### Lighthouse Scores

| Category | Desktop | Mobile |
|----------|---------|--------|
| **Accessibility** | 92/100 | 88/100 |
| **Best Practices** | 100/100 | 100/100 |
| **SEO** | 100/100 | 100/100 |

**Performance Metrics (Desktop):**
- CLS: 0.031 (Good — below 0.1 threshold)
- No console errors
- No deprecated APIs
- No third-party cookies
- Valid source maps

---

### CRITICAL FINDINGS (Must Fix)

| # | Severity | Issue | File:Line | Fix |
|---|----------|-------|-----------|-----|
| 1 | **Critical** | **No Content Security Policy (CSP) header.** Lighthouse reports "No CSP found in enforcement mode" (High severity). Without CSP, the app is vulnerable to XSS attacks, especially since user input flows through AI parsing and OCR. | `next.config.ts` | Add CSP header via `next.config.ts` `headers()` or Cloudflare Workers. At minimum: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://generativelanguage.googleapis.com; img-src 'self' blob: data:` |
| 2 | **Critical** | **No HSTS header.** "No HSTS header found" (High severity). HTTPS downgrade attacks possible. | `next.config.ts` | Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| 3 | **Critical** | **No X-Frame-Options / CSP frame-ancestors.** "No frame control policy found" (High severity). Clickjacking possible — an attacker could embed the finance app in an iframe. | `next.config.ts` | Add `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'` |

---

### HIGH SEVERITY (Fix Before Production Polish)

| # | Severity | Issue | File:Line | Fix |
|---|----------|-------|-----------|-----|
| 4 | **High** | **Color contrast failures (WCAG AA 1.4.3).** Two elements fail 4.5:1 ratio: (a) "Add" button text: `#ffffff` on `#6366f1` = 4.46:1; (b) "View All Records (1)" link: `#6366f1` on `#18181b` = 3.96:1. | `globals.css` `.btn-primary`, link color | Bump primary to `#5b5bd6` or adjust font weight/size to meet AA. For link: use `#818cf8` or brighter on dark backgrounds. |
| 5 | **High** | **`aria-hidden="true"` sidebar contains focusable buttons.** Lighthouse `aria-hidden-focus` audit fails (serious impact). Three buttons inside the hidden sidebar drawer are still focusable via Tab. Screen readers skip them but keyboard users can tab into invisible content. | `src/app/page.tsx` (sidebar drawer) | Add `tabindex="-1"` and `inert` attribute to the sidebar when closed, or disable buttons when `aria-hidden="true"`. |
| 6 | **High** | **No Cross-Origin-Opener-Policy (COOP) header.** "No COOP header found" (High severity). Reduces Spectre-style side-channel attack surface. | `next.config.ts` | Add `Cross-Origin-Opener-Policy: same-origin` |
| 7 | **High** | **No Trusted Types directive.** Without Trusted Types, DOM-based XSS via `innerHTML` / `dangerouslySetInnerHTML` is possible. | `next.config.ts` | Add CSP `require-trusted-types-for 'script'` (after ensuring all DOM sinks are safe). |

---

### MEDIUM SEVERITY (Fix in Next Iteration)

| # | Severity | Issue | File:Line | Fix |
|---|----------|-------|-----------|-----|
| 8 | **Medium** | **Rate limiter uses in-memory `Map`.** On Cloudflare Workers (stateless edge), the rate limit map resets on every cold start. Effective rate limiting requires D1 or KV storage. | `api/ai/parse/route.ts:12` | Use Cloudflare D1 or KV to persist rate limit counters across invocations. |
| 9 | **Medium** | **Gemini API key leaked in URL query string.** The API key is passed as `?key=...` in the fetch URL. While HTTPS protects in transit, the key may appear in server logs, CDN logs, or browser history. | `api/ai/parse/route.ts:86`, `api/ai/report/route.ts:75` | Pass the API key in the `x-goog-api-key` header instead of the URL. |
| 10 | **Medium** | **Input not sanitized before AI prompt.** User input is trimmed and truncated to 500 chars but not sanitized for prompt injection. A malicious user could craft input to manipulate the AI response. | `api/ai/parse/route.ts:62,88` | Add prompt injection guards: escape special instructions, use structured output mode, validate AI response against expected schema strictly. |
| 11 | **Medium** | **OCR worker not terminated on error path.** If `worker.setParameters` throws, the `finally` block still runs, but if `createWorker` itself fails after partial init, workers may leak. | `src/lib/ocr.ts:50-72` | Wrap `createWorker` in try/catch and ensure cleanup on partial failures. |
| 12 | **Medium** | **CSV export vulnerable to formula injection.** Transaction descriptions starting with `=`, `+`, `-`, or `@` could execute formulas in Excel/Google Sheets. | `src/app/transactions/page.tsx` (CSV export) | Prefix CSV cell values with a single quote `'` or sanitize formula-triggering characters. |
| 13 | **Medium** | **No `rel="noopener noreferrer"` on external links.** If any external links are added in the future, they could access `window.opener`. | Various | Add `rel="noopener noreferrer"` to all `target="_blank"` links. |
| 14 | **Medium** | **Session cookie `sameSite: "lax"` but CSRF uses double-submit cookie pattern.** Lax allows cookie on top-level GET navigations. For a personal-use app this is acceptable, but `sameSite: "strict"` would be more secure. | `api/auth/login/route.ts:50` | Consider `sameSite: "strict"` for session cookie since there are no cross-site POST needs. |

---

### LOW SEVERITY (Suggestions)

| # | Issue | File:Line | Fix |
|---|-------|-----------|-----|
| 15 | **No `Permissions-Policy` header.** Camera, microphone, geolocation not explicitly disabled. | `next.config.ts` | Add `Permissions-Policy: camera=(), microphone=(), geolocation=()` |
| 16 | **No `X-Content-Type-Options: nosniff` header.** Browser may MIME-sniff responses. | `next.config.ts` | Add `X-Content-Type-Options: nosniff` |
| 17 | **Light theme color contrast not verified.** Lighthouse only tested dark mode. Light mode tokens (`--text-muted: #55555f` on `#f6f6f8`) should be validated. | `globals.css:67-68` | Run Lighthouse on light mode. `#55555f` on `#f6f6f8` = ~4.8:1 (passes AA but borderline). |
| 18 | **Tesseract.js bundle size.** tesseract.js adds ~2MB+ to client bundle. Lazy-load it only when OCR is needed. | `src/app/ai-copilot/page.tsx` | Use dynamic `import()` for OCR component. |
| 19 | **`console.log` statements in production.** `aiParser.ts:81,114` has `console.log` that leaks internal data. | `src/lib/aiParser.ts:81,114` | Remove or guard with `process.env.NODE_ENV === "development"`. |
| 20 | **No CSP nonce for inline scripts.** The theme init script uses `dangerouslySetInnerHTML`. | `src/app/layout.tsx:43` | Migrate to a script that reads from a data attribute, or use CSP nonce. |
| 21 | **GitHub Actions workflow builds with `GOOGLE_API_KEY` at build time.** The key is baked into the serverless function bundle. | `.github/workflows/deploy.yml:26` | Set `GOOGLE_API_KEY` as a Cloudflare Pages env var instead of build-time secret. |

---

### SECURITY AUDIT SUMMARY

| Area | Status | Notes |
|------|--------|-------|
| **Authentication** | ✅ Good | PBKDF2 (100k iterations, SHA-256), HMAC-SHA256 session tokens, HttpOnly cookies |
| **CSRF Protection** | ✅ Good | Double-submit cookie pattern with constant-time comparison. All mutating endpoints (POST/PUT/DELETE) require CSRF token. |
| **Session Secret** | ✅ Good | No hardcoded fallback. Throws error if `SESSION_SECRET` not configured. |
| **SQL Injection** | ✅ Good | All queries use parameterized statements (`?` placeholders with `.bind()`) |
| **Password Storage** | ✅ Good | PBKDF2 with random salt, 100k iterations |
| **Input Validation** | ⚠️ Partial | Zod schema for AI responses, basic validation on forms. Prompt injection not addressed. |
| **HTTPS** | ✅ Good | Enforced via Cloudflare |
| **Security Headers** | ❌ Missing | No CSP, HSTS, XFO, COOP, X-Content-Type-Options, Permissions-Policy |
| **API Key Exposure** | ⚠️ Risk | Gemini API key in URL query string |
| **Rate Limiting** | ⚠️ Weak | In-memory only, resets on cold start |

---

### ACCESSIBILITY AUDIT (WCAG 2.1 AA)

| Criterion | Status | Notes |
|-----------|--------|-------|
| **1.4.3 Contrast (Minimum)** | ❌ Fail | 2 elements fail 4.5:1 ratio |
| **1.4.4 Resize Text** | ✅ Pass | No `maximumScale`/`userScalable` restrictions |
| **2.1.1 Keyboard** | ✅ Pass | All functionality available via keyboard |
| **2.1.2 No Keyboard Trap** | ✅ Pass | Focus trap in modals works correctly |
| **2.4.1 Bypass Blocks** | ✅ Pass | Skip-to-content link present |
| **2.4.3 Focus Order** | ⚠️ Partial | Sidebar `aria-hidden` contains focusable elements |
| **2.4.7 Focus Visible** | ✅ Pass | `:focus-visible` ring implemented |
| **3.3.1 Error Identification** | ✅ Pass | Inline error messages in forms |
| **4.1.2 Name, Role, Value** | ✅ Pass | ARIA roles, labels, and states properly set |
| **Modal Accessibility** | ✅ Pass | `role="dialog"`, `aria-modal="true"`, focus trap, Escape-to-close |
| **Reduced Motion** | ✅ Pass | `@media (prefers-reduced-motion: reduce)` implemented |
| **Touch Targets** | ✅ Pass | All interactive elements ≥44×44px |
| **Skip Link** | ✅ Pass | Visible on focus, targets main content |
| **Form Labels** | ✅ Pass | All inputs have associated labels or `aria-label` |
| **Progressbar ARIA** | ✅ Pass | Analytics progress bars have proper ARIA attributes |

---

### PERFORMANCE AUDIT

| Metric | Value | Status |
|--------|-------|--------|
| **CLS** | 0.031 | ✅ Good (<0.1) |
| **Console Errors** | 0 | ✅ Excellent |
| **Deprecated APIs** | 0 | ✅ Excellent |
| **Third-party Cookies** | 0 | ✅ Excellent |
| **Source Maps** | Valid | ✅ Good |
| **Network Requests** | 24 (all 200 OK) | ✅ Good |
| **Image Optimization** | Responsive, correct aspect ratios | ✅ Good |
| **Bundle Splitting** | Code-split by route | ✅ Good |

---

### CODE QUALITY AUDIT

| Area | Status | Notes |
|------|--------|-------|
| **TypeScript** | ✅ Good | Full TS coverage, proper interfaces |
| **Error Handling** | ✅ Good | Try/catch on all API routes, user-friendly error messages |
| **Database Queries** | ✅ Good | Parameterized, indexed columns, batch inserts |
| **Auth Pattern** | ✅ Good | Consistent `requireAuth()` helper across all routes |
| **Client/Server Split** | ✅ Good | `"use client"` / `"use server"` properly separated |
| **CSS Architecture** | ✅ Good | Design tokens, CSS variables, consistent naming |
| **Component Structure** | ✅ Good | Reusable components, proper props interfaces |
| **Accessibility Hooks** | ✅ Good | Shared `useModalAccessibility` hook for all modals |
| **Toast System** | ✅ Good | Context provider with auto-dismiss |
| **Theme System** | ✅ Good | Dark/light with `prefers-color-scheme` detection |

---

### PRIORITY ACTION PLAN

**Immediate (Security Blockers):**

1. **Add security headers** — CSP, HSTS, X-Frame-Options, COOP, X-Content-Type-Options, Permissions-Policy. Configure in `next.config.ts` or Cloudflare Workers.
2. **Move Gemini API key to header** — Stop passing in URL query string.
3. **Fix `aria-hidden` sidebar focus** — Add `inert` attribute or disable buttons when hidden.

**High Priority:**

4. **Fix color contrast** — Adjust `#6366f1` to `#5b5bd6` or brighter for button text, and use lighter indigo for links on dark backgrounds.
5. **Add rate limiting to D1/KV** — In-memory rate limiting is ineffective on edge.
6. **Add `Permissions-Policy` header** — Disable unused browser APIs.

**Medium Priority:**

7. **Add prompt injection guards** — Sanitize user input before AI prompts.
8. **Remove `console.log` from production** — Clean up `aiParser.ts`.
9. **Lazy-load Tesseract.js** — Reduce initial bundle size by ~2MB.
10. **Fix CSV formula injection** — Sanitize exported data.

**Low Priority (Polish):**

11. **Verify light mode contrast** — Run Lighthouse audit in light theme.
12. **Move `GOOGLE_API_KEY` from build to runtime** — Set in Cloudflare Pages env vars.
13. **Add CSP nonce for inline scripts** — Migrate theme init to external script.

---

### WHAT'S WORKING WELL

The following areas are well-implemented and exemplary:

- **Authentication system** — PBKDF2 + HMAC-SHA256 is production-grade for a personal app
- **CSRF double-submit pattern** — Correct implementation with constant-time comparison
- **Parameterized SQL queries** — No SQL injection vectors
- **Modal accessibility** — Shared hook with focus trap, Escape, restore focus
- **Responsive design** — Mobile-first with bottom nav, FAB, and fluid grid
- **Dark/light theme** — System preference detection with localStorage persistence
- **Toast notification system** — Context provider with auto-dismiss
- **Form validation** — Inline error messages with `aria-invalid` and `aria-describedby`
- **Error handling** — Consistent try/catch across all API routes
- **Skip-to-content link** — Proper WCAG bypass block
- **Reduced motion support** — Respects `prefers-reduced-motion`
- **Keyboard focus ring** — Global `:focus-visible` styling
- **Category selector** — Proper `role="radiogroup"` with `aria-checked`
- **AI fallback parser** — Manual regex fallback when AI is unavailable
- **Rate limiting** — Basic protection on AI endpoints (even if in-memory)

---

**End of Report**
