/**
 * Logic hook for the desktop retailer modal. Owns the terms/deal view switch,
 * the logo fallback, the activation message the host acts on, and the labels —
 * so the view is pure UI.
 *
 * Named for the surface because `useRetailerCardModal` is the mobile sheet's.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../../utils/message'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { getInitials } from '../../../utils/getInitials'

interface Args {
    closeFn: () => void
    name: string
    cashback: string
    iframeUrl?: string
    token?: string
    domain?: string
    fallbackLogo?: string
}

export const useRetailerCardModalDesktop = ({
    closeFn, name, cashback, iframeUrl, token, domain, fallbackLogo: fallbackLogoProp,
}: Args) => {
    const { t } = useTranslation()
    const { sendAnalyticsEvent } = useAnalytics()
    const { extensionId, cryptoSymbols, showTerms } = useRouteLoaderData('root') as LoaderData
    const [fallbackLogo, setFallbackLogo] = useState(fallbackLogoProp || '')
    const [showingTerms, setShowingTerms] = useState(false)

    const onClose = () => {
        setShowingTerms(false)
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

    return {
        showTerms,
        showingTerms,
        openTerms: () => setShowingTerms(true),
        closeTerms: () => setShowingTerms(false),
        fallbackLogo,
        useFallbackLogo: () => setFallbackLogo(getInitials(name)),
        onClose,
        activate: () => {
            window.postMessage({
                from: 'bringweb3',
                action: 'PORTAL_ACTIVATE',
                extensionId,
                time: 30 * 60 * 1000, // 30 minutes
                domain,
                iframeUrl,
                token
            })
            onClose()
            sendAnalyticsEvent('retailer_shop', {
                category: 'user_action',
                action: 'click',
                details: name,
            })
        },
        labels: {
            back: t('back'),
            shopAndEarn: t('shopAndEarn', { cashback, symbol: cryptoSymbols[0] }),
            startShopping: t('startShopping'),
            loadingBtn: t('loadingBtn'),
            termsConsent: t('termsConsent'),
            termsAndExclusions: t('termsAndExclusions'),
        },
    }
}
