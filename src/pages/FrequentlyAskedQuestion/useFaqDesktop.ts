/**
 * Logic hook for the desktop FAQ page. Owns the FAQ query, the open-entry
 * state, the back handler and the labels — so the page view is pure UI.
 *
 * Named for the surface because `useFaqPage` is the mobile page's hook; the
 * query key matches so the two share one cache entry.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFaq } from './useFaq'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useSkeletonPreview } from '../../hooks/useSkeletonPreview'

// The design draws five placeholder rows; the real count is unknown until the
// FAQ answers.
export const SKELETON_ROWS = [0, 1, 2, 3, 4]

export const useFaqDesktop = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { sendAnalyticsEvent } = useAnalytics()
    const [currentIndex, setCurrentIndex] = useState(-1)

    const { data, isLoading } = useFaq()
    const skeletonPreview = useSkeletonPreview()

    return {
        faq: data?.faq,
        indentationMark: data?.indentationMark,
        showSkeleton: isLoading || skeletonPreview,
        isOpen: (itemOrder: number) => currentIndex === itemOrder,
        // Clicking the open entry closes it.
        toggle: (itemOrder: number) => setCurrentIndex(current => current === itemOrder ? -1 : itemOrder),
        goToView: (view: 'coupons' | 'cashback') => navigate('/', { state: { view } }),
        goBack: () => {
            sendAnalyticsEvent('topbar_back', {
                category: 'user_action',
                action: 'click',
                details: 'to: /'
            })
            navigate(-1)
        },
        labels: {
            back: t('back'),
            title: t('faqTitle'),
        },
    }
}
