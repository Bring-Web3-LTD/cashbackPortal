/**
 * Google Identity Services (GIS), loaded on demand.
 *
 * The OAuth *auth-code* flow: our own button opens Google's popup and gets back
 * a one-time authorization code. The code goes straight to the backend, which
 * exchanges it for an ID token using the client secret and verifies that token.
 * Nothing sensitive passes through the browser, and nothing Google renders
 * appears on the page — `google.accounts.id.renderButton` draws an iframe that
 * repaints late, fights the portal's theme, and turns into a "Sign in as <name>"
 * card once the visitor has signed in before.
 *
 * Same client and same approach as the landing pages, which share this backend.
 */

// Public by design: it identifies the app to Google and ships in the bundle
// either way. The client SECRET lives only in the backend's SSM parameter.
//
// Hardcoded rather than an env var — one Google client serves every
// environment, with each origin listed under its "Authorized JavaScript
// origins". The backend checks every token's `aud` against its own
// GOOGLE_CLIENT_ID, so the two MUST stay identical.
export const googleClientId =
    '394616033024-ole1qfa0mraf2m0gmh1kas74ks82ciu1.apps.googleusercontent.com'

// All we need from the account: `openid` to get an ID token at all, `email` to
// put an address in it. Anything more shows a consent screen for data we never
// read.
const SCOPE = 'openid email'

const SRC = 'https://accounts.google.com/gsi/client'

// Only the slice of GIS this file touches, declared here rather than pulling in
// @types/google.accounts for one call.
interface CodeClientConfig {
    client_id: string
    scope: string
    ux_mode: 'popup'
    callback: (response: { code?: string; error?: string }) => void
    error_callback: (error: { type: string }) => void
}

declare global {
    const google: {
        accounts: {
            oauth2: {
                initCodeClient: (config: CodeClientConfig) => { requestCode: () => void }
            }
        }
    }
}

// Memoised: every caller shares one <script>, and a second mount (React's
// StrictMode double-invoke included) reuses the resolved promise.
let loading: Promise<void> | undefined

export const loadGoogleIdentity = (): Promise<void> =>
    (loading ??= new Promise((resolve, reject) => {
        const el = document.createElement('script')
        el.src = SRC
        el.async = true
        el.onload = () => resolve()
        el.onerror = () => {
            // Let a later attempt retry rather than caching the failure forever.
            loading = undefined
            reject(new Error('Google sign-in failed to load'))
        }
        document.head.appendChild(el)
    }))

/**
 * Opens Google's popup and resolves with the one-time authorization code.
 *
 * Resolves `null` when the visitor declines, closes the popup, or the browser
 * blocks it — none of those are errors to report, the button simply stays put
 * and a second click retries.
 *
 * Must be called from a click: browsers only allow a popup during a user
 * gesture, and awaiting the (already warm) script promise keeps that gesture.
 */
export const requestGoogleCode = async (): Promise<string | null> => {
    if (!googleClientId) return null
    try {
        await loadGoogleIdentity()
    } catch {
        return null
    }

    return new Promise(resolve => {
        // Built per call so it closes over this `resolve` — no client to keep
        // in sync between renders.
        google.accounts.oauth2
            .initCodeClient({
                client_id: googleClientId,
                scope: SCOPE,
                ux_mode: 'popup',
                // `error` is the OAuth one, `access_denied` when the visitor
                // declines — their answer, not a failure.
                callback: ({ code }) => resolve(code ?? null),
                error_callback: () => resolve(null),
            })
            .requestCode()
    })
}
