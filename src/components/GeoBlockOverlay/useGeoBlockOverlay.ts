import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'

/**
 * Labels for the not-live overlay, focus on the dialog so it is announced, a
 * focus trap (Tab cycles through the legal links, never out of the dialog, so
 * an embedded portal does not hand focus to the partner page), and the page
 * scroll lock while it is up: the overlay is permanent (no close button), so
 * nothing behind it may scroll.
 */
export const useGeoBlockOverlay = () => {
    const { t } = useTranslation()
    // The page behind is inert, so the legal links live on the overlay (CLAUDE.md GDPR rule 7)
    const { bringTou, privacy } = useRouteLoaderData('root') as LoaderData
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        dialog?.focus()

        const trapFocus = (event: KeyboardEvent) => {
            if (event.key !== 'Tab' || !dialog) return
            const links = Array.from(dialog.querySelectorAll<HTMLElement>('a[href]'))
            event.preventDefault()
            if (!links.length) {
                dialog.focus()
                return
            }
            const index = links.indexOf(document.activeElement as HTMLElement)
            const step = event.shiftKey ? -1 : 1
            // From the dialog itself (index -1): Tab goes to the first link, Shift+Tab to the last
            const next = index === -1
                ? (event.shiftKey ? links.length - 1 : 0)
                : (index + step + links.length) % links.length
            links[next].focus()
        }
        document.addEventListener('keydown', trapFocus)

        const { documentElement: html, body } = document
        const prevHtml = html.style.overflow
        const prevBody = body.style.overflow
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', trapFocus)
            html.style.overflow = prevHtml
            body.style.overflow = prevBody
        }
    }, [])

    return {
        dialogRef,
        privacy,
        bringTou,
        privacyLabel: t('privacy', 'Privacy'),
        termsLabel: t('termsOfUse', 'Terms of Use'),
        title: t('geoBlockTitle', "We're sorry but this service is not yet live in your area."),
        body: t('geoBlockBody', 'Please check again in a few weeks'),
    }
}
