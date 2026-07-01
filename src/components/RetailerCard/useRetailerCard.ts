/**
 * Logic hook for the RetailerCard. Owns the logo-fallback state and derives
 * the formatted cashback + token symbol + logo-error handler so the view is
 * pure UI.
 */
import { useMemo, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import formatCashback from '../../utils/formatCashback'
import { getInitials } from '../../utils/getInitials'

export interface RetailerCardProps {
    retailer: Retailer
    iconPath: string
    onClick: (retailer: Retailer) => void
    /** True while a committed search filters the list — shows "name/section". */
    isSearching?: boolean
}

export const useRetailerCard = ({ retailer, isSearching }: RetailerCardProps) => {
    const { cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()
    const [fallbackLogo, setFallbackLogo] = useState('')

    const cashback = useMemo(
        () => formatCashback(retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency),
        [retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency],
    )

    // While searching, append the matched section like desktop ("StockX/adidas").
    // Overflow is handled by the card's CSS ellipsis, so no char cap here.
    const label = retailer.displayName || retailer.name
    const offerName = useMemo(
        () => (isSearching && retailer.section ? `${label}/${retailer.section}` : label),
        [isSearching, retailer.section, label],
    )

    const tokenSymbol = cryptoSymbols?.[0] ?? ''

    const labels = {
        upTo: t('upTo'),
        in: t('in'),
        shop: t('shop'),
    }

    return {
        labels,
        cashback,
        tokenSymbol,
        offerName,
        fallbackLogo,
        onLogoError: () => setFallbackLogo(getInitials(retailer.displayName)),
    }
}
