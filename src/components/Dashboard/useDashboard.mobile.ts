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
export type DashboardMode = 'cashback' | 'coupons'

export interface DashboardProps {
    mode: DashboardMode
    onModeChange: (mode: DashboardMode) => void
    /** Opens the claim flow from the Claim tile. */
    onClaim: () => void
    /** Opens the email pairing flow from the Pair Wallet pill. */
    onPairWallet: () => void
}

/**
 * $ badge text, per the Figma dev note: three digits and the dot moves
 * ($1.25, $12.3, $123); from $1,000 the K takes one of them ($1.2K, $12K);
 * under $1 two decimals ($0.25); under a cent "<$0.01". Zero stays $0.00,
 * which Figma draws too. The thresholds sit on the rounding edge so a value
 * never rounds into one more digit ($999.5 is $1.0K, not $1,000).
 */
const formatUsdBadge = (usd: number) => {
    if (usd > 0 && usd < 0.01) return '<$0.01'
    const digits: Intl.NumberFormatOptions =
        usd < 1
            ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            : usd < 999.5
              ? { minimumSignificantDigits: 3, maximumSignificantDigits: 3 }
              : { notation: 'compact', minimumSignificantDigits: 2, maximumSignificantDigits: 2 }
    return Math.max(0, usd).toLocaleString('en-US', { style: 'currency', currency: 'USD', ...digits })
}

// Both tiles show the $ badge (Figma dev note).
const toTile = (token: Token | undefined, fallbackSymbol: string) => ({
    amount: token?.tokenAmountDisplay ?? '0.00',
    symbol: token?.tokenSymbol ?? fallbackSymbol,
    name: token?.displayName ?? null,
    usd: formatUsdBadge(token?.totalEstimatedUsd ?? 0),
})

export const useDashboard = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const {
        cryptoSymbols,
        couponsEnabled,
        isHub,
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
        // On a noClaim platform the tile opens the claim flow, which shows
        // the coming-soon sheet.
        claim: t('claim'),
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
        pending: toTile(pending, fallbackSymbol),
        claim: toTile(eligible, fallbackSymbol),
        labels,
        goToPending: () => navigate('/pending'),
        goToMore: () => navigate('/history'),
        goToWhatsThis: () => navigate('/whats-this'),
    }
}
