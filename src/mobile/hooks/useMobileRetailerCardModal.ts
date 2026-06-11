/**
 * Logic hook for MobileRetailerCardModal. Owns the logo-fallback + navigating
 * state, the reset-on-open and body-scroll-lock effects, and derives the
 * formatted cashback + token symbol so the .tsx is pure UI.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import formatCashback from '../../utils/formatCashback'
import { getInitials } from '../../utils/getInitials'

export interface MobileRetailerCardModalProps {
    open: boolean
    retailer: Retailer | null
    iconPath: string
    terms: string
    /** Pre-fetched retailer redirect URL. Empty until activate() resolves. */
    redirectLink: string
    onCancel: () => void
    onGoToShop: () => void
}

export const useMobileRetailerCardModal = ({
    open,
    retailer,
    onGoToShop,
}: MobileRetailerCardModalProps) => {
    const { cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()
    const [fallbackLogo, setFallbackLogo] = useState('')
    // Spinner state set only after tapping "Go to shop"; reset on retailer change.
    const [isNavigating, setIsNavigating] = useState(false)

    // Reset logo fallback whenever the retailer changes so a new icon attempts
    // a fresh load instead of inheriting the previous retailer's failure state.
    useEffect(() => {
        setFallbackLogo('')
        setIsNavigating(false)
    }, [retailer?.id, open])

    // Lock background page scroll while the modal is open so the only
    // scrollbar that ever appears is the (hidden) one inside the T&C box.
    // Some mobile browsers scroll <html>, others <body>, so lock both.
    useEffect(() => {
        if (!open) return
        const { documentElement: html, body } = document
        const prevHtml = html.style.overflow
        const prevBody = body.style.overflow
        const prevTouch = body.style.touchAction
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        body.style.touchAction = 'none'
        return () => {
            html.style.overflow = prevHtml
            body.style.overflow = prevBody
            body.style.touchAction = prevTouch
        }
    }, [open])

    const cashback = useMemo(
        () =>
            retailer
                ? formatCashback(retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency)
                : '',
        [retailer],
    )

    const tokenSymbol = cryptoSymbols?.[0] ?? ''

    return {
        t,
        fallbackLogo,
        onLogoError: () => {
            if (retailer) setFallbackLogo(getInitials(retailer.displayName))
        },
        isNavigating,
        onGoToShopClick: () => {
            setIsNavigating(true)
            onGoToShop()
        },
        cashback,
        tokenSymbol,
    }
}
