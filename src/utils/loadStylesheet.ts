/**
 * Append (or replace) the portal's theme stylesheets in <head>.
 *
 * Desktop and mobile are fully separate cascades:
 *   - desktop mode → DEFAULT/stylesheets + [base/stylesheets] + platform/stylesheets
 *   - mobile  mode → DEFAULT/mobile/stylesheets + [base/mobile/stylesheets] + platform/mobile/stylesheets
 * where `base` is the platform a `<PLATFORM>REWARDS` platform inherits from.
   Calling again with a different `theme` swaps the tags so the
 * UI re-paints (used by `SESSION_UPDATE` re-syncs).
 */
const ALLOWED_THEMES = ['light', 'dark'] as const
type Theme = (typeof ALLOWED_THEMES)[number]
export type StylesheetMode = 'desktop' | 'mobile'
// Platform names are interpolated into stylesheet URLs, so restrict them to
// a safe alphanumeric/underscore/dash charset to prevent path traversal or
// unexpected requests when the value comes from URL params or token fields.
const SAFE_PLATFORM = /^[A-Z0-9_-]{1,64}$/

const normalizeTheme = (theme: string): Theme =>
    (ALLOWED_THEMES as readonly string[]).includes(theme.toLowerCase())
        ? (theme.toLowerCase() as Theme)
        : 'light'

export const normalizePlatform = (platform: string): string => {
    const upper = platform?.toUpperCase() ?? ''
    return SAFE_PLATFORM.test(upper) ? upper : 'DEFAULT'
}

// A `<PLATFORM>REWARDS` platform uses `<PLATFORM>`'s assets (styles, icons,
// translations) unless it ships its own.
export const basePlatform = (platform: string): string | null =>
    /^(.+)REWARDS$/.exec(platform)?.[1] ?? null

export const loadStylesheet = (theme: string, platform: string, mode: StylesheetMode = 'desktop') => {
    const safeTheme = normalizeTheme(theme)
    const safePlatform = normalizePlatform(platform)
    const base = basePlatform(safePlatform)

    const set = (id: string, href: string, beforeId?: string) => {
        const existing = document.getElementById(id) as HTMLLinkElement | null
        if (existing) {
            if (existing.href.endsWith(href)) return
            existing.href = href
            return
        }
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = href
        // insertBefore(link, null) appends
        document.head.insertBefore(link, (beforeId && document.getElementById(beforeId)) || null)
    }

    const remove = (id: string) => document.getElementById(id)?.remove()
    const setOrRemove = (id: string, href: string | null, beforeId?: string) => (href ? set(id, href, beforeId) : remove(id))

    if (mode === 'mobile') {
        // Mobile is fully self-contained — load ONLY the mobile sheets and tear
        // down any desktop sheet so no desktop variable or global rule leaks in.
        remove('bring-portal-theme-default')
        remove('bring-portal-theme-base')
        remove('bring-portal-theme-platform')

        set('bring-portal-theme-default-mobile', `/DEFAULT/mobile/stylesheets/${safeTheme}.css`)
        setOrRemove('bring-portal-theme-base-mobile', base && `/${base}/mobile/stylesheets/${safeTheme}.css`, 'bring-portal-theme-platform-mobile')
        setOrRemove('bring-portal-theme-platform-mobile', safePlatform !== 'DEFAULT' ? `/${safePlatform}/mobile/stylesheets/${safeTheme}.css` : null)
        return
    }

    // Desktop: load the desktop sheets and tear down any mobile sheet.
    remove('bring-portal-theme-default-mobile')
    remove('bring-portal-theme-base-mobile')
    remove('bring-portal-theme-platform-mobile')

    set('bring-portal-theme-default', `/DEFAULT/stylesheets/${safeTheme}.css`)
    setOrRemove('bring-portal-theme-base', base && `/${base}/stylesheets/${safeTheme}.css`, 'bring-portal-theme-platform')
    setOrRemove('bring-portal-theme-platform', safePlatform !== 'DEFAULT' ? `/${safePlatform}/stylesheets/${safeTheme}.css` : null)
}
