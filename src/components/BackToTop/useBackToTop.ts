/**
 * Logic hook for the floating scroll-to-top button. Owns the scroll listener
 * that decides whether it is shown, the scroll-to-top handler and the label —
 * so the view is pure UI.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const useBackToTop = () => {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > window.innerHeight)
        // Run once on mount: a reload part-way down the page starts scrolled.
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return {
        visible,
        scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        labels: { backToTop: t('backToTop', 'Back to top') },
    }
}
