// Publisher click id: campaign links from publishers carry `?cid=<value>`
// (their own tracking id). It is sent back as `clickId` in every API request
// body so the backend can attribute the registration and fire the
// publisher's postback with it. Opaque to us: stored and forwarded verbatim.
//
// Captured from the URL on first load in the tab and kept in sessionStorage
// like the flowId: the resolver forwards it into the `/?id=...` redirect, but
// later in-flow navigations and reloads must not lose it. The URL wins over a
// stored value so a fresh publisher link always overrides an older one.
const KEY = 'rh_click_id'
const PARAM = 'cid'

const load = (): string | null => {
  const fromUrl = new URLSearchParams(window.location.search).get(PARAM)
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

export const clickId = load()
