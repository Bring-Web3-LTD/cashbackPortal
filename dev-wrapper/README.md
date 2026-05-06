# Cashback Portal: dev wrapper

A tiny local "fake partner" page used to develop the iframe-mode integration
end-to-end against a dev API. It also contains a minimal mock wallet + a
reusable integration bridge that mirror what a real partner site would
implement.

## What it does

1. Reads `theme`, `walletAddress`, `extensionId` from the controls.
2. Calls `POST $VITE_PORTAL_API` (the dev `check/portal` endpoint) with
   `x-api-key: $VITE_PORTAL_API_KEY`.
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
| `VITE_PORTAL_API` | Full URL of the `check/portal` endpoint. |
| `VITE_PORTAL_API_KEY` | Partner `x-api-key` header. |
| `VITE_PORTAL_EXTENSION_ID` | Default value for the Extension ID input. |
| `VITE_PORTAL_LOCAL_URL` | If set, the wrapper rewrites the iframe origin to this URL while keeping the `?token=…` query — lets you iterate on the local portal while still using a real dev token. Leave empty to use the API's `iframeUrl` as-is. |
| `VITE_PORTAL_WALLET` | Optional default wallet address used by the mock wallet on auto-connect. Leave empty for a random throwaway address. |

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
