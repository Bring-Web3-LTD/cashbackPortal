# Cashback Portal: dev wrapper

A tiny local "fake partner" page used to develop the iframe-mode integration
end-to-end against a dev API. It also contains a minimal mock wallet + a
reusable integration bridge that mirror what a real partner site would
implement.

## What it does

1. Reads `theme`, `walletAddress`, `extensionId` from the controls.
2. Calls `POST $VITE_PORTAL_API` (the dev `check/portal` endpoint) with
   `x-api-key: $VITE_PORTAL_API_KEY`. The URL and key actually used are
   chosen by the **Wallet provider** selector — see
   [Per-provider API](#per-provider-api). The active API path (stage) is
   shown read-only above the Inputs.
3. On the first response, sets the iframe `src` from `portalUrl` (the JWT is
   already embedded in its query string — no `postMessage` needed). The
   legacy `iframeUrl` field is ignored.
4. On every later input change, calls `check/portal` again and posts a
   single `{ action: 'SESSION_UPDATE', token }` message to the
   iframe. The portal re-verifies the token and pulls the new
   `walletAddress` (and any other session info such as `theme`) from the
   verify response.
5. Listens for `postMessage` actions from the portal (`LOGIN`,
   `SIGN_MESSAGE`, `POPUP_CLOSED`) and replies via the mock wallet.

## File layout

| File | Role |
| --- | --- |
| [`mockWallet.ts`](./mockWallet.ts) | **Fake wallet SDK** — knows nothing about Bring or iframes. Exposes `connect`, `signMessage`, `disconnect`, `getAddress`. Drop-in replaceable with a real wallet adapter (Casper Wallet, MetaMask, viem, ethers, …). |
| [`portalBridge.ts`](./portalBridge.ts) | **Integration glue** — owns the `message` listener, knows the `from: 'bringweb3'` / `to: 'bringweb3'` protocol, and translates portal actions into wallet calls. This is the file a real partner would adapt. |
| [`main.ts`](./main.ts) | Wires the wallet + bridge to the wrapper UI (sidebar controls, header button, event log). |

## Setup

```bash
cd dev-wrapper
cp .env.example .env.local
# fill in VITE_PORTAL_API, VITE_PORTAL_API_KEY, VITE_PORTAL_EXTENSION_ID, …
yarn install
```

### Environment variables (`dev-wrapper/.env.local`)

| Var | Purpose |
| --- | --- |
| `VITE_PORTAL_API` | Full URL of the `check/portal` endpoint (default / fallback). |
| `VITE_PORTAL_API_KEY` | Partner `x-api-key` header (default / fallback, used when the selected provider has no key of its own — e.g. `mock`). |
| `VITE_PORTAL_API_KEY_<PROVIDER>` | Per-provider `x-api-key`, picked by the **Wallet provider** selector. `<PROVIDER>` ∈ `NIGHTLY`, `SOLFLARE`, `YOROI`, `CASPER`, `ECKO`, `READY`. Falls back to `VITE_PORTAL_API_KEY` when unset. |
| `VITE_PORTAL_API_<PROVIDER>` | Optional per-provider API URL override (same `<PROVIDER>` values). Falls back to `VITE_PORTAL_API` when unset. |
| `VITE_PORTAL_EXTENSION_ID` | Default value for the Extension ID input. |
| `VITE_PORTAL_LOCAL_URL` | If set, the wrapper rewrites the iframe origin to this URL while keeping the `?token=…` query — lets you iterate on the local portal while still using a real dev token. Leave empty to use the API's `iframeUrl` as-is. |
| `VITE_PORTAL_WALLET` | Optional default wallet address used by the mock wallet on auto-connect. Leave empty for a random throwaway address. |
| `VITE_VISUAL_DIFF` | Start state of the [visual-diff overlay](#visual-diff-overlay). The overlay is **always available**; `1`/`true` starts it expanded, anything else (or unset) starts it collapsed. |
| `FIGMA_TOKEN` | Server-side Figma personal access token (never exposed to the browser). Lets the overlay's **Figma** field render a frame straight from a Figma link via the dev `/__figma-image` proxy. Create one at <https://www.figma.com/developers/api#access-tokens>. |

### Per-provider API

The **Wallet provider** selector picks both the simulated wallet adapter and
the API the wrapper talks to. For the selected provider `P`, the wrapper
resolves:

- URL: `VITE_PORTAL_API_<P>` → falls back to `VITE_PORTAL_API`.
- Key: `VITE_PORTAL_API_KEY_<P>` → falls back to `VITE_PORTAL_API_KEY`.

So you only need to set the per-provider vars for platforms that differ; the
plain `VITE_PORTAL_API` / `VITE_PORTAL_API_KEY` act as the default (and are
what `mock` uses). Changing the selector re-bootstraps a fresh session and
reloads the iframe.

## Run

From the repo root:

```bash
yarn dev:all      # portal on :5173 + wrapper on :5174
```

Or run them separately:

```bash
yarn dev          # portal on http://localhost:5173
yarn dev:wrapper  # wrapper on http://localhost:5174
```

Open <http://localhost:5174>.

## UI

- **Header / wallet button** — top-right. Click to connect (sends
  `SESSION_UPDATE`) or, when connected, click the short `0xab12…cdef`
  pill to disconnect.
- **Sidebar — Wallet provider** — selects which wallet adapter to simulate and
  which API URL/key to use (see [Per-provider API](#per-provider-api)).
  Switching it starts a brand-new portal session and reloads the iframe.
- **Sidebar — API path** — read-only text above the Inputs showing the active
  API stage. It's set from the env on deploy, not editable in the UI.
- **Sidebar — Inputs** — theme / wallet / extension ID + Refresh. Changing any
  value re-calls the API and posts the new token to the iframe.
- **Sidebar — Mock wallet SDK** — toggles for *Start disconnected*,
  *Auto-respond to LOGIN*, *Auto-respond to SIGN_MESSAGE*, plus manual
  *Send connect* / *Abort sign* buttons.
- **Sidebar — Event log** — colour-coded stream of all messages
  (`←` inbound, `→` outbound, `✗` error, `·` info) with timestamps and JSON
  payloads.
- **Sidebar — Last API response** (collapsed by default) — read-only view of
  the last `portalUrl` and decoded JWT payload.
- **Toggle button** on the sidebar edge collapses the controls to give the
  iframe full width.

## Visual diff overlay

A dev-only tool for pixel-comparing the running page against a design. It lays
a semi-transparent image over the wrapper page so you can check spacing, sizes
and colours against a Figma frame. It's always mounted; `VITE_VISUAL_DIFF`
only controls whether it starts expanded or collapsed (see env vars above).
State (image, position, scale, toggles) is persisted to `localStorage`.

The overlay ships in the hosted build too. Image-by-**URL**, **File** picker and
drag & drop work anywhere. The **Figma** loader needs a token: locally it uses
the server-side `FIGMA_TOKEN` via the `/__figma-image` proxy; on the hosted site
(no proxy) paste a token into the overlay's **Token** field and it calls the
Figma API directly from the browser. That token stays in your browser's
`localStorage` and is never part of the build.

When collapsed it sits as a slim vertical **Visual diff** tab pinned to the
right edge; click it to expand the control panel (use the `▾` button to
collapse again).

### Loading an image

| Control | What it does |
| --- | --- |
| **Figma** field + `load` | Paste a Figma design link (`figma.com/design/…?node-id=…`) and click `load`. Locally (with `FIGMA_TOKEN` set) it resolves the node to a PNG via the dev `/__figma-image` proxy. If you fill the **Token** field, it calls the Figma API directly from the browser instead — which is what makes this work on the hosted build (where the proxy doesn't exist). |
| **Token** field | Optional Figma personal access token. Stored only in this browser's `localStorage` (key `bring.visualDiff.figmaToken`), sent only as the `X-Figma-Token` header on direct Figma API calls. Use this on the hosted site; leave empty locally to use the proxy/`FIGMA_TOKEN`. Create one at <https://www.figma.com/developers/api#access-tokens>. |
| **URL** field | Paste a direct image URL (`https://…` or a `data:` URI). Used as-is — no Figma API. |
| **File** picker | Choose a local image (PNG / JPEG / WebP). |
| **Drop box** / drag & drop | Drop an image file or a Figma asset onto the box (or anywhere on the page). Only active while the overlay is visible and movable. |

### Positioning & comparison

| Control | What it does |
| --- | --- |
| **X / Y** | Overlay position in px. You can also drag the image directly (when movable) or nudge with arrow keys (`shift` = 10px). |
| **Scale** | Manual scale factor. |
| **Opacity** | Overlay transparency. |
| `diff` | Toggles `mix-blend-mode: difference` — matching pixels go **black**, mismatches show bright/coloured. |
| `border` | Toggles a magenta outline around the image so its bounds are visible (doesn't shift size/position). |
| `fit` | Scales the image to the iframe width and centers it. **Toggle** — click again to restore the previous size/position. |
| `center` | Centers horizontally over the iframe without changing scale. |
| `hide` / `show` | Hides/shows the overlay image (panel stays). |
| `🔓 movable` / `🔒 locked` | Locks the overlay so it ignores pointer events (and disables dragging). |
| `reset` | Clears the overlay back to defaults. |

## Protocol cheatsheet

| Direction | Action | Payload |
| --- | --- | --- |
| ← portal → partner | `LOGIN` | `{}` |
| ← portal → partner | `SIGN_MESSAGE` | `{ messageToSign, amount, tokenSymbol }` |
| ← portal → partner | `POPUP_CLOSED` | `{}` |
| → partner → portal | `SESSION_UPDATE` | `{ token }` (fresh JWT from `check/portal`; portal re-verifies and pulls the new wallet / theme / etc. from the verify response) |
| → partner → portal | `SIGNATURE` | `{ signature, key, message }` |
| → partner → portal | `ABORT_SIGN_MESSAGE` | `{}` |

All portal-originated messages carry `from: 'bringweb3'`; all partner replies
carry `to: 'bringweb3'`.
