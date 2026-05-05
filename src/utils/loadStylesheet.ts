/**
 * Append (or replace) the portal's theme stylesheets in <head>.
 *
 * The DEFAULT sheet is always loaded first; the platform-specific sheet is
 * layered on top via normal CSS source order. Calling this function again
 * with a different `theme` swaps the existing tags so the UI re-paints with
 * the new variables (used by `SESSION_UPDATE` re-syncs).
 */
export const loadStylesheet = (theme: string, platform: string) => {
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

    set('bring-portal-theme-default', `/DEFAULT/stylesheets/${theme}.css`)

    const upper = platform?.toUpperCase()
    if (upper && upper !== 'DEFAULT') {
        set('bring-portal-theme-platform', `/${upper}/stylesheets/${theme}.css`)
    } else {
        document.getElementById('bring-portal-theme-platform')?.remove()
    }
}
