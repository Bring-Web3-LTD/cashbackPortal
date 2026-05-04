<a href="https://bring.network/"><img width="150px" src="https://media.bringweb3.io/logos/logo_doc.png"/></a>

# Cashback Portal: Partner Integration Guide

This document explains how partners can integrate the Bring **Cashback Portal** into their product.

There are two supported integration modes:

1. [**Hosted by Bring**](#option-1--hosted-by-bringweb3): we host the portal; you provide an SDK hook so we can detect/connect the wallet and request a signature.
2. [**Self-hosted iframe**](#option-2--self-hosted-iframe): you embed the portal in an iframe inside your own page.

Pick the option that best fits your product. Both modes give the end user the same Cashback Portal experience.

> **Branding & styling.** In both modes, the portal's visual style (colors, logos, typography, etc.) is defined with you during onboarding and implemented by the Bring team. The `theme` parameter only switches between the **dark** and **light** variants of that defined style. It does not let you change the design at runtime.

---

## Prerequisites

Depending on the integration mode you choose, you may need:

- **`apiKey`** *(self-hosted iframe mode only)*: your partner API key, issued by Bring. Sent as the `x-api-key` header on the bootstrap call. 
- **`extensionId`** *(only if you also use the [Bring Chrome extension kit](https://www.npmjs.com/package/@bringweb3/chrome-extension-kit))*: the ID of **your own** Chrome extension (the one in which you installed the kit). This is **not** issued by Bring. It is used to correlate portal sessions with extension activity.

The hosted mode (Option 1) does not require an API key on your side.

---

## Option 1: Hosted by Bring

In this mode, Bring hosts the Cashback Portal web app for you.

The portal can be served from either:

- **A Bring domain** (`your-brand@bringweb3.io`): quickest to set up, no DNS work required.
- **A dedicated domain you own** (e.g. `cashback.your-brand.com`): you point a DNS record to our infrastructure and we serve the portal from your branded domain. Recommended if you want the portal to live under your own brand.

Reach out during onboarding to choose between the two and to coordinate DNS / certificates if you go with a dedicated domain.

Regardless of which domain is used, you only need to provide:

### 1. A wallet SDK / bridge

We need to be able to:

- **Detect the connected wallet address** of the current user.
- **Prompt a wallet connection** if no wallet is connected yet.
- **Request a signature** for a message we provide (used to authenticate the user for claim requests).

Expose these capabilities to us through the SDK / interface we agree on during onboarding.

### 2. Theme (optional)

If your product supports multiple themes, tell us which one is active so the portal matches your UI:

- `theme: 'dark' | 'light'`

If you only have a single theme, you can skip this and we will use the default.

### 3. `extensionId` (only if using the [Bring Chrome extension kit](https://www.npmjs.com/package/@bringweb3/chrome-extension-kit))

If you also ship the Bring Chrome extension kit inside your own Chrome extension, send us your **`extensionId`** (the ID of your extension) upfront, together with the SDK details. We need it to correlate portal sessions with extension activity.

That is everything required for the hosted mode. No embedding, routing, or API calls on your side.

---

## Option 2: Self-hosted iframe

In this mode you embed the Cashback Portal inside your own page using an iframe.

### 1. Add the iframe

Render an iframe that fills its container:

```html
<iframe
  id="bring-cashback-portal"
  src=""
  style="width: 100%; height: 100%; border: 0;"
></iframe>
```

The `src` is set dynamically from the response of the bootstrap call below.

### 2. Bootstrap call (on page load)

On page load, call our portal bootstrap endpoint to obtain the iframe URL and an auth token.

**Endpoint**

```
POST https://api.bringweb3.io/v1/extension/check/portal
```

**Headers**

| Header        | Value                       |
| ------------- | --------------------------- |
| `x-api-key`   | Your partner API key        |
| `Content-Type`| `application/json`          |

**Body**

| Field         | Type                  | Required | Description                                                  |
| ------------- | --------------------- | -------- | ------------------------------------------------------------ |
| `extensionId` | `string`              | No       | Required only if you also use the [Bring Chrome extension kit](https://www.npmjs.com/package/@bringweb3/chrome-extension-kit). The ID of your own Chrome extension (the one in which you installed the kit). |
| `walletAddress` | `string \| null`    | Yes      | Connected wallet address, or `null` if unknown / not connected. |
| `theme`       | `'dark' \| 'light'`   | No       | The current theme of your app. Omit if you only support a single theme. |

**Example request**

```ts
const res = await fetch('https://api.bringweb3.io/v1/extension/check/portal', {
  method: 'POST',
  headers: {
    'x-api-key': PARTNER_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    extensionId: 'your-extension-id',
    walletAddress: currentWalletAddress ?? null,
    theme: currentTheme, // 'dark' | 'light'
  }),
});

const { iframeUrl, token } = await res.json();
```

**Response**

```json
{
  "iframeUrl": "https://portal.bringweb3.io/...",
  "token": "<jwt-or-opaque-token>"
}
```

### 3. Load the iframe

Set the iframe `src` to the returned `iframeUrl`. The initial `token` is already embedded in the URL, so no further action is needed for the first load:

```ts
const iframe = document.getElementById('bring-cashback-portal') as HTMLIFrameElement;
iframe.src = iframeUrl;
```

### 4. Re-sync on parameter changes

Whenever any of the inputs change (the user **connects / disconnects / switches wallet**, or the **theme** changes), repeat the bootstrap call with the updated values and post the new `token` to the iframe via `postMessage`:

```ts
async function refreshPortal({ walletAddress, theme }) {
  const res = await fetch('https://api.bringweb3.io/v1/extension/check/portal', {
    method: 'POST',
    headers: {
      'x-api-key': PARTNER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      extensionId: 'your-extension-id',
      walletAddress: walletAddress ?? null,
      theme,
    }),
  });

  const { token } = await res.json();

  iframe.contentWindow?.postMessage(
    { type: 'BRING_PORTAL_TOKEN', token },
    new URL(iframe.src).origin,
  );
}
```

You typically do **not** need to change the iframe `src` again. Just post the refreshed `token`.

> Always pass the explicit target origin to `postMessage` (do not use `'*'`).

---

## Minimal React example (iframe mode)

```tsx
import { useEffect, useRef, useState } from 'react';

const API_URL = 'https://api.bringweb3.io/v1/extension/check/portal';
const EXTENSION_ID = 'your-extension-id';
const API_KEY = import.meta.env.VITE_BRING_API_KEY;

type Theme = 'dark' | 'light';

export function CashbackPortal({
  walletAddress,
  theme,
}: {
  walletAddress: string | null;
  theme: Theme;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extensionId: EXTENSION_ID,
          walletAddress,
          theme,
        }),
      });

      const { iframeUrl: url, token } = await res.json();
      if (cancelled) return;

      if (isFirstLoad.current) {
        // First load: the token is already embedded in iframeUrl.
        isFirstLoad.current = false;
        setIframeUrl(url);
      } else {
        // Subsequent updates: keep the same iframe, post the new token.
        const iframe = iframeRef.current;
        iframe?.contentWindow?.postMessage(
          { type: 'BRING_PORTAL_TOKEN', token },
          new URL(url).origin,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, theme]);

  return (
    <iframe
      ref={iframeRef}
      src={iframeUrl ?? undefined}
      title="Bring Cashback Portal"
      style={{ width: '100%', height: '100%', border: 0 }}
    />
  );
}
```

---

## Summary

| Concern                    | Hosted by Bring              | Self-hosted iframe                  |
| -------------------------- | -------------------------------- | ----------------------------------- |
| Where the portal runs      | Bring or your dedicated domain | Inside your page (iframe)           |
| What you provide           | Wallet SDK + theme               | API key, wallet, theme (+ `extensionId` if using the extension kit) |
| Bootstrap API call         | Not required                     | `POST /v1/extension/check/portal`   |
| Token handling             | Handled by Bring             | Embedded in initial `iframeUrl`; `postMessage` on updates |
| Re-sync on changes         | Handled by Bring             | Re-call API and post new `token`    |

For any questions or to receive your API key, contact the Bring team.
