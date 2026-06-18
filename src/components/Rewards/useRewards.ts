/**
 * Logic hook for the mobile Rewards block. Pulls the shared balance query,
 * derives the claimable / pending display values + claim-button state, owns the
 * nav/support handlers, and resolves the labels — so the view stays pure UI.
 */
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBalance, selectEligible, selectPending } from '../../hooks/useBalance'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'

export const useRewards = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { platform, cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { data, isLoading } = useBalance()

    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress ?? ''}&env=${ENV}`

    const eligible = selectEligible(data)
    const pending = selectPending(data)

    // Fall back to "0.00" when no balance row yet (e.g. no wallet connected).
    const fallbackSymbol = cryptoSymbols?.[0] ?? ''
    const claimableDisplay = eligible?.tokenAmountDisplay ?? '0.00'
    const claimableSymbol = eligible?.tokenSymbol ?? fallbackSymbol
    const pendingDisplay = pending?.tokenAmountDisplay ?? '0.00'
    const pendingSymbol = pending?.tokenSymbol ?? fallbackSymbol

    const canOpenClaim = !!eligible && eligible.tokenAmount > 0

    // Below minimum claim threshold → claim still opens (minimum overlay) but
    // the button shows disabled coloring per design.
    const belowMinimum =
        !!eligible &&
        eligible.tokenAmount > 0 &&
        eligible.tokenAmount < (eligible.minimumClaimThreshold ?? 0)

    const labels = {
        rewards: t('rewards'),
        claimable: t('claimable'),
        claim: t('claim'),
        pending: t('pending'),
        viewRewards: t('viewRewards'),
        needHelp: t('needHelp'),
        missingReward: t('missingReward'),
    }

    return {
        isLoading,
        claimableDisplay,
        claimableSymbol,
        pendingDisplay,
        pendingSymbol,
        canOpenClaim,
        belowMinimum,
        labels,
        goToHistory: () => navigate('/history'),
        goToFaq: () => navigate('/faq'),
        openSupport: () => window.open(supportUrl, '_blank', 'noopener,noreferrer'),
    }
}
