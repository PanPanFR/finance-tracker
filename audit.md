## Comprehensive UI/UX Audit Report — Finance Tracker

**Audited:** 2026-08-23  
**Project:** `finance-tracker` (Next.js + Tailwind + Cloudflare D1)  
**Scope:** Full codebase review — visual design, components, layouts, interactions, accessibility, mobile responsiveness, and critical security findings affecting UI.

---

### ⚠️ CRITICAL FINDINGS (Must Fix Before Release)

| # | Severity | Issue | File:Line | Fix |
|---|----------|-------|-----------|-----|
| 1 | **Critical** | **Pinch zoom disabled** — `userScalable: false` + `maximumScale: 1` violates WCAG 1.4.4 (Resize Text). Users with low vision cannot enlarge content. | `src/app/layout.tsx:33` | Remove `maximumScale` and `userScalable` restrictions. Allow pinch-to-zoom. |
| 2 | **Critical** | **No CSRF protection** on all mutating endpoints (POST/PUT/DELETE). Attacker can forge requests that execute actions while user is authenticated. | `src/app/api/transactions/route.ts:35`, `[id]/route.ts:51`, `auth/change-password/route.ts:19` | Implement CSRF token pattern (synchronizer token or double-submit cookie). |
| 3 | **Critical** | **Hardcoded session secret** — fallback `"dev-secret-key-finance-tracker-cloudflare-pages-personal-use"` in source. Anyone reading the bundle can forge session tokens. | `src/lib/auth.ts:29` | Make `SESSION_SECRET` a required env var. Throw error if missing. No fallback. |
| 4 | **Critical** | **Modals lack `role="dialog"` and focus trapping.** Keyboard users can Tab behind overlay. Screen readers don't announce dialogs. | `src/components/TransactionForm.tsx:106`, `ConfirmModal.tsx:30`, `SettingsModal.tsx:57` | Add `role="dialog" aria-modal="true"`. Implement focus trap. Move focus to modal on open. |

---

### ⚠️ HIGH SEVERITY (Fix Before Production)

| # | Severity | Issue | File:Line | Fix |
|---|----------|-------|-----------|-----|
| 5 | **High** | **Color contrast failures** — `--text-muted: #71717a` on `#09090b` ≈ 3.9:1 (fails WCAG AA 4.5:1). `--text-dim: #52525b` ≈ 2.5:1 — catastrophic failure. Used everywhere: labels, placeholders, footers. | `src/app/globals.css:17-18`, `PasswordGate.tsx:145` | Bump `--text-muted` to `#7c7c85` or lighter. Bump `--text-dim` to `#71717a` minimum. |
| 6 | **High** | **Settings page has two duplicate password change forms** — `SettingsModal.tsx` (dead code) and `settings/page.tsx` both implement identical form. | `SettingsModal.tsx`, `settings/page.tsx:111-184` | Delete `SettingsModal.tsx` entirely. Use only the page version. |
| 7 | **High** | **Sidebar/status dot pulse animation** has no `prefers-reduced-motion` support. Users with vestibular disorders are affected. | `src/app/globals.css:410-413` | Wrap all `transition`/`animation` declarations in `@media (prefers-reduced-motion: no-preference)`. |
| 8 | **High** | **Modals don't close on Escape key.** Only the sidebar drawer handles Escape. All three modals rely on overlay click or X button only. | `TransactionForm.tsx:106`, `ConfirmModal.tsx:29`, `SettingsModal.tsx:57` | Add `useEffect` Escape handler to each modal (or shared hook). |
| 9 | **High** | **"Today's Income" card displays top expense category.** Footer shows `topCategory` derived from expense-only map — misleading in income card. | `src/app/page.tsx:289` | Remove the category footer from income card. Show transaction count instead, or derive `topIncomeCategory`. |
| 10 | **High** | **No pagination/infinite scroll** for transactions page. All filtered results rendered in single DOM. Performance degrades with many records. | `src/app/transactions/page.tsx:404` | Add server-side pagination (e.g., 50 per page) or infinite scroll. |

---

### ⚡ MEDIUM SEVERITY (Fix in Next Iteration)

| # | Severity | Issue | File:Line | Fix |
|---|----------|-------|-----------|-----|
| 11 | **Medium** | **Excessive inline styles** — 20-40+ `style={{}}` blocks across pages. Creates visual inconsistency and bloats HTML. | `page.tsx:205-208`, `transactions/page.tsx:240-262`, `settings/page.tsx:68,82,84-96,199,222` | Extract repeated patterns into CSS classes (e.g., `.page-header`, `.stat-card`). |
| 12 | **Medium** | **Loading states are plain text** — no skeleton screens. Causes jarring layout shift when content pops in. | `page.tsx:400-402`, `transactions/page.tsx:376-378` | Create `Skeleton` component mirroring `transaction-card` layout with pulsing placeholders. |
| 13 | **Medium** | **"Rp 0" shown for new users** — three hero metric cards show zero value with no onboarding guidance. | `src/app/page.tsx:234-236,266-268,284-286` | When `transactions.length === 0`, show onboarding state: "No data yet — record your first transaction" with prominent CTA. |
| 14 | **Medium** | **Delete action is optimistic with no undo.** Transaction removed from state immediately; if API fails, re-fetch causes flicker. No undo path for accidental deletes. | `page.tsx:170-187`, `transactions/page.tsx:203-220` | Add "Undo" toast action after deletion. Or delay DOM removal until API confirms. |
| 15 | **Medium** | **Form validation gives no feedback.** `handleSubmit` silently returns on invalid input. No red borders, no error messages. | `src/components/TransactionForm.tsx:83-96` | Add inline error messages ("Description is required", "Amount must be > 0") below respective fields. |
| 16 | **Medium** | **Transaction form submit button has no loading state.** User can double-click and create duplicate entries. | `TransactionForm.tsx:246-261` | Add `submitting` state that disables button and shows spinner during `onSubmit`. |
| 17 | **Medium** | **Category selector grid hardcoded to 3 columns.** On narrow screens (< 360px), category names like "Bills & Utilities" truncate. | `globals.css:1411` | Change to `grid-template-columns: repeat(auto-fill, minmax(90px, 1fr))` for responsive reflow. |
| 18 | **Medium** | **Transaction amounts lack consistent coloring.** `.amount-expense` is `var(--text-primary)` (white) instead of red/pink `#fb7185`. Inconsistent with hero cards. | `globals.css:1125-1127` | Change `.amount-expense` to `color: var(--color-expense)` / `#fb7185`. |

---

### 💡 SUGGESTION (Polish & UX Improvements)

| # | Issue | File:Line | Fix |
|---|-------|-----------|-----|
| 19 | **No focus-visible styles** — Zero `:focus-visible`/`:focus` ring styles for buttons/links. Keyboard users cannot see where focus is. | `globals.css` (entire file) | Add global rule: `*:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }` |
| 20 | **Modals lack ARIA attributes** — No `role="dialog"`, `aria-modal="true"`, or `aria-labelledby` on any modal. | `TransactionForm.tsx:107`, `ConfirmModal.tsx:30`, `SettingsModal.tsx:58` | Add `role="dialog" aria-modal="true" aria-labelledby="dialog-title"` to `.modal-dialog`. Give titles `id="dialog-title"`. |
| 21 | **Search inputs lack labels** — All use only `placeholder`. Screen readers won't announce purpose. | `page.tsx:370`, `transactions/page.tsx:304`, `ai-copilot/page.tsx:178` | Add `aria-label="Search transactions"` (or `<label>` with `.sr-only` class). |
| 22 | **Segmented buttons lack ARIA state** — Type filter buttons don't use `aria-pressed`. | `page.tsx:373-395`, `transactions/page.tsx:314-334` | Add `aria-pressed={selectedType === "all"}` etc. to each button. |
| 23 | **Touch targets below 44×44px** — `.action-btn-icon` has `padding: 0.3rem` (~5px). Preset pill and category buttons also borderline. | `globals.css:1147`, `:1393` | Increase padding to `≥0.6rem` or set `min-width: 44px` / `min-height: 44px`. |
| 24 | **CSV formula injection** — Descriptions with `=`, `+`, `-`, `@` prefixes could execute in Excel/Sheets. | `transactions/page.tsx:165` | Prefix CSV values with single quote `'` or sanitize formula-triggering characters. |
| 25 | **No skip-to-content link** — Keyboard users must tab through all nav on every page load. | `layout.tsx` | Add first-focusable skip link targeting `<main>`. Style on `:focus`. |
| 26 | **Progress bars lack ARIA** — No `role="progressbar"` / `aria-valuenow` / `aria-valuemin` / `aria-valuemax`. | `analytics/page.tsx:233` | Add `role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}`. |
| 27 | **No `prefers-color-scheme` detection** — Dark mode is hardcoded `<html className="dark">`. No light mode toggle. | `layout.tsx:44` | Detect `prefers-color-scheme` via JS/CSS. Provide theme switcher that persists preference. |
| 28 | **Category select lacks radiogroup semantics** — Grid of buttons used as radio group but no `role="radiogroup"` or `aria-selected`. | `TransactionForm.tsx:217` | Add `role="radiogroup"` to container, `role="radio" aria-selected={isSelected}` to each button. |
| 29 | **Loading states not announced** — "Loading transactions..." not read by screen readers. | `page.tsx:399`, `transactions/page.tsx:376` | Add `aria-live="polite"` on loading container. Add `aria-busy="true"` during fetch. |
| 30 | **No reduced-motion support** — All CSS transitions/transforms play unconditionally. | `globals.css` | Add `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }`. |

---

### 📋 Priority Action Plan

**Immediate (Blockers — fix before any release):**

1. **Enable pinch zoom** — Remove `userScalable: false` / `maximumScale: 1` from `layout.tsx:33`. WCAG compliance.
2. **Add CSRF protection** — Implement synchronizer token pattern on all mutating API endpoints. Critical security+UX.
3. **Fix hardcoded session secret** — Make `SESSION_SECRET` required env var. No fallback.
4. **Add modal accessibility** — `role="dialog"`, focus trap, Escape-to-close on all modals.
5. **Fix color contrast** — Bump `--text-muted` and `--text-dim` to pass WCAG AA on `#09090b`.

**High Priority (fix within 2 sprints):**

6. **Delete `SettingsModal.tsx`** — Dead code. Use only the settings page form.
7. **Add pagination/infinite scroll** to transactions page.
8. **Add "Undo" after deletion** — Brief delay or toast with undo action.
9. **Add form validation feedback** — Inline error messages in `TransactionForm`.
10. **Fix "Today's Income" card** — Remove misleading category footer.

**Medium Priority (polish):**

11. **Replace inline styles** with CSS classes for repeated patterns.
12. **Add skeleton loading states** instead of plain text.
13. **Fix transaction amount coloring** — `.amount-expense` should be `#fb7185`.
14. **Add responsive category grid** — `repeat(auto-fill, minmax(90px, 1fr))`.
15. **Add focus-visible styles** globally.
16. **Add touch target min-size** of 44×44px for all interactive elements.
17. **Fix duplicate quick action tiles** — "AI Copilot" and "Scan Receipt" both link to `/ai-copilot`. Make distinct or clarify.

**Low Priority (future enhancement):**

18. **Add theme switcher** (light/dark toggle with `prefers-color-scheme` detection).
19. **Add AI chart visualizations** to analytics page (navigation promises "charts & trends").
20. **Add skip-to-content link** for keyboard navigation.
21. **Add password strength meter** and increase min length to 8 characters.

---

### ✅ Verified — What Looks Good

The following areas are well-implemented and require no changes:

- **Visual design tokens** — Consistent color variables, radius scales, font families defined in `globals.css:3-41`.
- **Dark theme implementation** — Cohesive dark-on-dark scheme with appropriate surface/card distinctions.
- **Icon system** — Unified `Icons.tsx` with consistent `IconProps` interface across 30+ icons.
- **Responsive breakpoints** — Tailwind media queries at 640px, 768px, 860px, 900px, 1200px properly structured.
- **Transaction form category selector** — SVG category icons with text labels are functional and attractive.
- **Toast notification system** — Context provider, auto-dismiss, success/error styling all working.
- **Sidebar drawer** — Smooth slide-open/close, overlay behavior, and Escape key handling are correct.
- **Mobile bottom navigation** — Fixed positioning, space-around layout, and active state styling work well.
- **Panel component** — Consistent card styling with headers, titles, and subtitles across pages.
- **Progress bar analytics** — Horizontal bar stats with color-coded income/expense are functional.

---
**End of Report**