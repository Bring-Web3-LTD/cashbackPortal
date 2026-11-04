import { API_KEY, API_URL_USERS } from '../config'
import { flowId } from './flow'
import { clickId } from './clickId'
import { campaignId } from './campaignId'

// Client-reported Rewards Hub funnel events for the sign-in screen, as on the
// landing pages; every other funnel step is recorded server-side. The backend
// takes all campaign attribution from the campaign row the id names, so only
// the current URL is sent alongside it. Without a campaign id the backend
// rejects the event, so none is sent.
type RhEventType = 'page_view' | 'close'

// How the user closed the flow: the X button, the header Back button, or
// leaving the site entirely (tab/window close, refresh, or any navigation that
// unloads the page - the browser can't tell these apart).
export type CloseTrigger = 'xButton' | 'backButton' | 'siteLeave'

// Fire-and-forget: never blocks the UI, network errors are swallowed.
// keepalive lets close survive the page being closed. Unlike the landing
// pages, the email is never sent: the portal keeps personal data out of
// analytics (CLAUDE.md, GDPR rule 1).
const send = (type: RhEventType, trigger?: CloseTrigger) => {
  if (!campaignId) return
  fetch(`${API_URL_USERS}analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    keepalive: true,
    body: JSON.stringify({
      id: campaignId,
      flowId,
      ...(clickId && { clickId }),
      type,
      page: window.location.href,
      ...(trigger && { trigger }),
    }),
  }).catch((err) => console.warn(`analytics ${type} failed`, err))
}

// A completed flow (sign-in verified) must not report its exit as a close,
// whatever the trigger.
let completed = false
export function markFunnelCompleted(value = true) {
  completed = value
}

// Reports the screen at most once per URL: safe to call on every mount -
// repeats (StrictMode's dev-only double effect run included) are dropped
// until the URL actually changes.
let viewing = false
let lastViewedHref = ''
export function trackPageView() {
  viewing = true
  if (window.location.href === lastViewedHref) return
  lastViewedHref = window.location.href
  completed = false
  send('page_view')
}

// Fired by the in-page controls (X button, Back button).
export function trackClose(trigger: CloseTrigger) {
  if (completed) return
  send('close', trigger)
}

// The page being unloaded while the sign-in screen is open is also an exit: a
// tab/window close, a refresh, or a hard navigation out of the site. pagehide
// is the last reliable moment to report it, and the keepalive fetch in send()
// survives the document being torn down.
window.addEventListener('pagehide', () => {
  if (viewing && !completed) send('close', 'siteLeave')
})

// Coming back via the browser's back button restores the page from the
// back-forward cache without a reload, so no code re-runs on its own. The
// pagehide above already reported that exit as a close, so the restored visit
// is a fresh entry. Completed flows are left alone.
window.addEventListener('pageshow', (event) => {
  if (event.persisted && viewing && !completed) {
    lastViewedHref = ''
    trackPageView()
  }
})
