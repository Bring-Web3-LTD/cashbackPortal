/**
 * Append (or replace) the portal's theme stylesheets in <head>.
 *
 * The DEFAULT sheet is always loaded first; the platform-specific sheet is
 * layered on top via normal CSS source order. Calling this function again
 * with a different `theme` swaps the existing tags so the UI re-paints with
 * the new variables (used by `SESSION_UPDATE` re-syncs).
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

const normalizePlatform = (platform: string): string => {
    const upper = platform?.toUpperCase() ?? ''
    return SAFE_PLATFORM.test(upper) ? upper : 'DEFAULT'
}

export const loadStylesheet = (theme: string, platform: string, mode: StylesheetMode = 'desktop') => {
    const safeTheme = normalizeTheme(theme)
    const safePlatform = normalizePlatform(platform)

    const set = (id: string, href: string) => {
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
        document.head.appendChild(link)
    }

    set('bring-portal-theme-default', `/DEFAULT/stylesheets/${safeTheme}.css`)

    if (safePlatform !== 'DEFAULT') {
        set('bring-portal-theme-platform', `/${safePlatform}/stylesheets/${safeTheme}.css`)
    } else {
        document.getElementById('bring-portal-theme-platform')?.remove()
    }

    // Mobile portal overlay: DEFAULT mobile sheet first, then platform mobile
    // sheet layered on top. Both are removed when switching back to desktop
    // so the same call can flip the UI between modes.
    if (mode === 'mobile') {
        set('bring-portal-theme-default-mobile', `/DEFAULT/mobile/stylesheets/${safeTheme}.css`)
        if (safePlatform !== 'DEFAULT') {
            set('bring-portal-theme-platform-mobile', `/${safePlatform}/mobile/stylesheets/${safeTheme}.css`)
        } else {
            document.getElementById('bring-portal-theme-platform-mobile')?.remove()
        }
    } else {
        document.getElementById('bring-portal-theme-default-mobile')?.remove()
        document.getElementById('bring-portal-theme-platform-mobile')?.remove()
    }
}
