/**
 * Append (or replace) the portal's theme stylesheets in <head>.
 *
 * Desktop and mobile are fully separate cascades:
 *   - desktop mode → DEFAULT/stylesheets + platform/stylesheets
 *   - mobile  mode → DEFAULT/mobile/stylesheets + platform/mobile/stylesheets
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

    const remove = (id: string) => document.getElementById(id)?.remove()

    if (mode === 'mobile') {
        // Mobile is fully self-contained — load ONLY the mobile sheets and tear
        // down any desktop sheet so no desktop variable or global rule leaks in.
        remove('bring-portal-theme-default')
        remove('bring-portal-theme-platform')

        set('bring-portal-theme-default-mobile', `/DEFAULT/mobile/stylesheets/${safeTheme}.css`)
        if (safePlatform !== 'DEFAULT') {
            set('bring-portal-theme-platform-mobile', `/${safePlatform}/mobile/stylesheets/${safeTheme}.css`)
        } else {
            remove('bring-portal-theme-platform-mobile')
        }
        return
    }

    // Desktop: load the desktop sheets and tear down any mobile sheet.
    remove('bring-portal-theme-default-mobile')
    remove('bring-portal-theme-platform-mobile')

    set('bring-portal-theme-default', `/DEFAULT/stylesheets/${safeTheme}.css`)
    if (safePlatform !== 'DEFAULT') {
        set('bring-portal-theme-platform', `/${safePlatform}/stylesheets/${safeTheme}.css`)
    } else {
        remove('bring-portal-theme-platform')
    }
}
