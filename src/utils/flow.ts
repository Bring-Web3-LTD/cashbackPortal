// Per-tab correlation id sent as `flowId` in every API request body, so the
// backend can stitch one visitor's funnel together (page views, OTP send /
// verify, remind-me-later) without depending on the email, which only exists
// from the middle of the flow onward.
//
// Minted on first load in the tab and kept in sessionStorage: it survives
// reloads and in-flow navigation, is not shared with other tabs, and is gone
// when the tab closes. Not a credential and not a user identifier - an opaque
// random value, meaningless on its own.
const KEY = 'rh_flow_id'

// crypto.randomUUID needs a secure context (https / localhost); the fallback
// keeps non-secure preview hosts working rather than throwing on import.
const mint = () =>
  crypto.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const load = () => {
  try {
    const existing = sessionStorage.getItem(KEY)
    if (existing) return existing
    const fresh = mint()
    sessionStorage.setItem(KEY, fresh)
    return fresh
  } catch {
    // Storage blocked (private mode / third-party restrictions): still send a
    // flowId, it just won't survive a reload.
    return mint()
  }
}

export const flowId = load()
