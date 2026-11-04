// Campaign id: a visitor who reaches the portal from a landing page carries
// `?id=<campaignId>` in the URL and signs up under that campaign exactly as on
// the landing page. Captured on first load and kept in sessionStorage like the
// flowId and clickId, so it survives the sign-in screen and the reload that
// follows it. The URL wins over a stored value so a fresh campaign link always
// overrides an older one. No id in the URL and none stored: the sign-up sends
// no `id` and registers without a campaign.
const KEY = 'rh_campaign_id'
const PARAM = 'id'

// landingPageCampaigns ids: 5 base62 characters
const CAMPAIGN_ID_RE = /^[0-9A-Za-z]{5}$/

const load = (): string | null => {
  const raw = new URLSearchParams(window.location.search).get(PARAM)
  const fromUrl = raw && CAMPAIGN_ID_RE.test(raw) ? raw : null
  try {
    if (fromUrl) {
      sessionStorage.setItem(KEY, fromUrl)
      return fromUrl
    }
    return sessionStorage.getItem(KEY)
  } catch {
    // Storage blocked (private mode / third-party restrictions): the value
    // from the URL still works for this page load.
    return fromUrl
  }
}

export const campaignId = load()
