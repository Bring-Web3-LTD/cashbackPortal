// Campaign id: a visitor who reaches the portal from a landing page carries
// `?id=<campaignId>` in the URL and signs up under that campaign exactly as on
// the landing page. Captured on first load and kept in sessionStorage like the
// flowId and clickId, so it survives the sign-in screen and the reload that
// follows it. The URL wins over a stored value so a fresh campaign link always
// overrides an older one. No id in the URL and none stored: the sign-up sends
// no `id` and registers without a campaign.
//
// The default campaign. only prevents a second redirect to the
// landing page. It is stored, but never sent to the backend.
import { DEFAULT_LANDING_URL } from '../config'

const KEY = 'rh_campaign_id'
const PARAM = 'id'

// landingPageCampaigns ids: 5 base62 characters
const CAMPAIGN_ID_RE = /^[0-9A-Za-z]{5}$/

const readId = (search: string): string | null => {
  const raw = new URLSearchParams(search).get(PARAM)
  return raw && CAMPAIGN_ID_RE.test(raw) ? raw : null
}

const load = (): string | null => {
  const fromUrl = readId(window.location.search)
  try {
    const stored = sessionStorage.getItem(KEY)
    // The default must not replace a publisher's campaign
    if (fromUrl && (!stored || fromUrl !== defaultId)) {
      sessionStorage.setItem(KEY, fromUrl)
      return fromUrl
    }
    return stored
  } catch {
    // Storage blocked (private mode / third-party restrictions): the value
    // from the URL still works for this page load.
    return fromUrl
  }
}

const defaultId = readId(DEFAULT_LANDING_URL.split('?')[1] ?? '')
const arrivalId = load()

export const campaignId = arrivalId === defaultId ? null : arrivalId

// Needs a valid default id: without one the landing page is a 404
export const landingRedirect = !arrivalId && defaultId ? DEFAULT_LANDING_URL : null

// Analytics report the full URL, so drop the default id before they read it
if (defaultId && readId(window.location.search) === defaultId) {
  const url = new URL(window.location.href)
  url.searchParams.delete(PARAM)
  window.history.replaceState(window.history.state, '', url)
}
