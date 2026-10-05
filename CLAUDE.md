# CLAUDE.md

Rules for every change in this repo. GDPR and accessibility sections are mandatory, not advisory.

## Project

- Cashback Portal: React 18 + Vite + TypeScript, CSS Modules. Runs hosted or inside a partner iframe (see README.md).
- Most components have a desktop `X.tsx` and a mobile `X.mobile.tsx`. Every rule below applies to both. Update both.
- i18n: react-i18next. Strings live in `public/<PLATFORM>/translations/<lang>.json`. Never hardcode user-facing text; use `t('key', 'Fallback')`.
- Checks: `yarn lint` and `yarn build`. No test runner and no jsx-a11y lint, so the checklists below are the enforcement.

## GDPR / privacy

Personal data this app handles (wallet addresses are pseudonymous personal data under GDPR):

| Data | Where | Purpose |
| --- | --- | --- |
| `walletAddress` | session (from `fetchToken`), analytics payload | identify user for cashback/claims |
| `userId` (UUID) | `localStorage` key `bring_<platform>_id` via `src/utils/getUserId.ts`; analytics payload | stable per-browser id |
| `flowId` (UUID) | memory, analytics payload | per-session correlation |
| session JWT | URL query param, memory | auth with Bring backend |
| page URL / path / title | analytics `page_view` | usage analytics |

Rules:

1. **Data minimisation.** Send and store only what the feature needs. Never add email, IP, user agent, geolocation, device fingerprint, or raw user input to analytics or storage. New analytics fields must be justified in the PR description.
2. **No new client-side persistence** (localStorage, sessionStorage, cookies, IndexedDB) unless strictly necessary. Prefer in-memory state. If unavoidable, add a row to the table above with key, purpose, and when it is cleared.
3. **No third-party trackers or SDKs** (GA, Mixpanel, Hotjar, Sentry, pixels, remote fonts, external CDNs). Analytics goes only through `src/api/analytics.ts` to the Bring backend, stays first-party, and measures only portal usage. That keeps it inside the audience-measurement exemption that lets us run without consent.
4. **Never log personal data.** No `console.log`/`console.error` containing walletAddress, userId, JWT, signatures, or decoded token payloads. Strip them before logging errors.
5. **Tokens stay in memory.** The JWT arrives in the URL; never copy it into storage, analytics, or logs. Never forward it to a non-Bring origin.
6. **`postMessage` always uses an explicit target origin.** Never `'*'`. Validate `event.data.action` before acting on incoming messages.
7. **Privacy and Terms links** (`privacy`, `bringTou` from the session) must stay visible and reachable on every page and theme. Do not hide them behind breakpoints.
8. **No consent banner, by design.** This portal must stay consent-free, so it may only do strictly necessary processing. Anything that would legally require consent is out of scope: marketing, profiling, cross-site tracking, third-party cookies, non-essential storage. Reject such requests and say why; do not add a consent UI to unlock them.
9. **Respect geo gating.** Honour `isCountryAvailable`; do not bypass it except via the existing `isTester` path.
10. **Erasure path.** Anything stored client-side that is tied to a wallet must be clearable on disconnect.

## Accessibility (WCAG 2.2 AA)

1. **Semantics.** `<button>` for actions, `<a href>` for navigation. No `div`/`span` with `onClick`. Only exception: overlay backdrops, which must be `aria-hidden="true"` and have a keyboard alternative (Escape or a real close button).
2. **Keyboard.** Every interactive element works with Tab, Enter, Space, and Escape. Custom widgets (cards, chips, suggestions) need `tabIndex={0}` plus `onKeyDown`, or better, become a real `<button>`.
3. **Focus visible.** Never `outline: none` without a `:focus-visible` replacement of at least 2px and 3:1 contrast in both themes. Existing violations: Categories, Header, Modal, Search mobile styles. Fix when touching those files.
4. **Modals.** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title. Move focus inside on open, trap Tab, return focus to the trigger on close. `src/components/Modal/Modal.tsx` currently only handles Escape; add the rest when touching it.
5. **Images and icons.** Meaningful `<img>` gets a descriptive `alt` (retailer name, not "logo"). Decorative images get `alt=""`. Icon-only buttons get a translated `aria-label`, e.g. `aria-label={t('close', 'Close')}`; `alt="x-mark"` is not a name.
6. **Contrast.** 4.5:1 for body text, 3:1 for large text and UI borders/icons. Verify in both dark and light themes. Never convey state by colour alone; add text or an icon.
7. **Text scaling.** Layout must survive 200% zoom. Use `rem` for type; avoid fixed-height containers that clip text.
8. **Forms and search.** Every input has a `<label>` or `aria-label`. Errors use `aria-describedby` and `role="alert"`. Autocomplete follows the combobox pattern: `role="combobox"`, `aria-expanded`, `aria-controls`, arrow-key navigation.
9. **Motion.** Gate framer-motion, Swiper autoplay, and Rive animations behind `prefers-reduced-motion: reduce` (CSS `@media` or framer's `useReducedMotion()`). No auto-advancing content without a pause control.
10. **Structure.** One `<h1>` per page, no skipped heading levels, landmarks (`<main>`, `<header>`, `<nav>`). Live values such as countdowns and claim status use `aria-live="polite"`.
11. **Touch targets.** Minimum 24x24 CSS px everywhere, 44x44 in `.mobile.tsx` variants.
12. **Language.** Keep `<html lang>` in sync with the active i18n language.

## Before finishing any UI change

- [ ] `yarn lint` and `yarn build` pass
- [ ] Tab through the feature: every control reachable, focus visible, Escape closes modals, focus returns to the trigger
- [ ] Every button has an accessible name, every image has correct `alt`, dialogs have a title
- [ ] Both desktop and `.mobile.tsx` variants updated
- [ ] No new storage keys, analytics fields, or logs containing personal data
- [ ] New strings added to the translation JSON, not hardcoded
