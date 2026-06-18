/**
 * Logic hook for the CashbackEarned card. Owns the Rive canvas + load-error
 * state, pulls the balance aggregate and derives the display strings so the
 * view is pure UI.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import { useRive, Layout, Fit } from '@rive-app/react-canvas'
import { useBalance, selectEligible, selectPending, selectTotalEarned } from '../../hooks/useBalance'

const formatUsd = (value: number): string => {
    // Always render two decimals so the zero state reads "$0.00", not "$0".
    if (!Number.isFinite(value) || value <= 0) return '$0.00'
    return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

export const useCashbackEarned = () => {
    const { t } = useTranslation()
    const { cryptoSymbols, iconsPath } = useRouteLoaderData('root') as LoaderData
    const { data, isLoading } = useBalance()

    const [riveFailed, setRiveFailed] = useState(false)
    const { RiveComponent } = useRive({
        src: `${iconsPath}/fennec-fox.riv`,
        autoplay: true,
        layout: new Layout({ fit: Fit.Cover }),
        onLoadError: () => setRiveFailed(true),
    })

    const eligible = selectEligible(data)
    const pending = selectPending(data)
    const totalEarned = selectTotalEarned(data)

    // Hero number = backend's aggregate totalEarned; fall back to "0.00".
    const amountDisplay = totalEarned?.tokenAmountDisplay ?? '0.00'
    const symbol =
        totalEarned?.tokenSymbol ??
        eligible?.tokenSymbol ??
        pending?.tokenSymbol ??
        cryptoSymbols?.[0] ??
        ''
    // USD subtitle from backend's aggregate value; fall back to 0 (eligible + pending would miss the claimed portion).
    const usdDisplay = formatUsd(totalEarned?.totalEstimatedUsd ?? 0)

    const labels = {
        cashbackEarned: t('cashbackEarned'),
        currentValue: t('currentValue'),
    }

    return {
        labels,
        isLoading,
        RiveComponent,
        riveFailed,
        amountDisplay,
        symbol,
        usdDisplay,
    }
}
