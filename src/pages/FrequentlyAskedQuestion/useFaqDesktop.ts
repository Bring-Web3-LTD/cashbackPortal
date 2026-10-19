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
    // Keyed by id: itemOrder repeats across the shared and platform rows, and
    // platform rows may use negative values.
    const [openId, setOpenId] = useState<string | null>(null)

    const { data, isLoading } = useFaq()
    const skeletonPreview = useSkeletonPreview()

    return {
        faq: data?.faq,
        indentationMark: data?.indentationMark,
        showSkeleton: isLoading || skeletonPreview,
        isOpen: (id: string) => openId === id,
        // Clicking the open entry closes it.
        toggle: (id: string) => setOpenId(current => current === id ? null : id),
        goToView: (view: 'coupons' | 'cashback') => navigate('/', { state: { view } }),
        goBack: () => {
            sendAnalyticsEvent('topbar_back', {
                category: 'user_action',
                action: 'click',
                details: 'to: /'
            })
            navigate('/')
        },
        labels: {
            back: t('back'),
            title: t('faqTitle'),
        },
    }
}
