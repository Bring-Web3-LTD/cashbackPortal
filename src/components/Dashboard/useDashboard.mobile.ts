/**
 * Logic hook for the generic mobile dashboard bar. Picks the slots from the
 * three state flags, derives the Pending / Claim values from the shared
 * balance query, and owns the nav handlers — so the view stays pure UI.
 */
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    useBalance,
    selectEligible,
    selectPending,
    selectFirstTimeUser,
    selectCanPairWallet,
} from '../../hooks/useBalance'
import { formatCurrency } from '../../pages/History/helpers'

export type DashboardMode = 'cashback' | 'coupons'

export interface DashboardProps {
    mode: DashboardMode
    onModeChange: (mode: DashboardMode) => void
    /** Opens the claim flow from the Claim tile. */
    onClaim: () => void
    /** Opens the email pairing flow from the Pair Wallet pill. */
    onPairWallet: () => void
}

export const useDashboard = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const {
        cryptoSymbols,
        couponsEnabled,
        isHub,
        noClaim,
        firstTimeUser: firstTimeOverride,
        canPairWallet: canPairOverride,
    } = useRouteLoaderData('root') as LoaderData
    const { data } = useBalance()

    const eligible = selectEligible(data)
    const pending = selectPending(data)
    const fallbackSymbol = cryptoSymbols?.[0] ?? ''

    const labels = {
        rewards: t('rewards'),
        coupons: t('coupons'),
        cashback: t('cashback'),
        pending: t('pending'),
        // A noClaim platform pays out itself: approved rewards are saved. The
        // tile still opens the claim flow, which shows the coming-soon sheet.
        claim: noClaim ? t('approved') : t('claim'),
        whatsThis: t('whatsThis'),
        pairWallet: t('pairWallet'),
        smartCashback: t('smartCashback'),
        more: t('more'),
    }

    return {
        // Dev wrapper override first, like the desktop dashboard; /cache otherwise.
        firstTimeUser: firstTimeOverride ?? selectFirstTimeUser(data),
        couponsEnabled: !!couponsEnabled,
        isHub: !!isHub,
        // Per-platform backend switch (/cache canPairWallet).
        showPairWallet: canPairOverride ?? selectCanPairWallet(data),
        pending: {
            amount: pending?.tokenAmountDisplay ?? '0.00',
            symbol: pending?.tokenSymbol ?? fallbackSymbol,
            usd: formatCurrency(pending?.totalEstimatedUsd ?? 0),
        },
        claim: {
            amount: eligible?.tokenAmountDisplay ?? '0.00',
            symbol: eligible?.tokenSymbol ?? fallbackSymbol,
            usd: formatCurrency(eligible?.totalEstimatedUsd ?? 0),
        },
        labels,
        goToPending: () => navigate('/pending'),
        goToMore: () => navigate('/history'),
        goToWhatsThis: () => navigate('/whats-this'),
    }
}
