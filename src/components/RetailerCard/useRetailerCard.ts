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
}

export const useRetailerCard = ({ retailer }: RetailerCardProps) => {
    const { cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()
    const [fallbackLogo, setFallbackLogo] = useState('')

    const cashback = useMemo(
        () => formatCashback(retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency),
        [retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency],
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
        fallbackLogo,
        onLogoError: () => setFallbackLogo(getInitials(retailer.displayName)),
    }
}
