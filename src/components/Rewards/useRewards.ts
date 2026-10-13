/**
 * Logic hook for the mobile Rewards block. Pulls the shared balance query,
 * derives the claimable / pending display values + claim-button state, owns the
 * nav/support handlers, and resolves the labels — so the view stays pure UI.
 */
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBalance, selectEligible, selectPending } from '../../hooks/useBalance'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { buildSupportUrl } from '../../utils/supportUrl'

export interface RewardsProps {
    /** Override the Claimable card's "Claim" click handler. */
    onClaim?: () => void
}

export const useRewards = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { platform, cryptoSymbols, noClaim, supportUrl: supportBase } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { data, isLoading } = useBalance()

    const supportUrl = buildSupportUrl(supportBase, platform, walletAddress)

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
        // A noClaim platform pays out itself: approved rewards are saved.
        claimable: noClaim ? t('approved') : t('claimable'),
        // Placeholder copy in public/BRING/mobile/translations/en.json until
        // Product supplies the text (TODO#686).
        noClaimTitle: t('noClaimTitle'),
        noClaimText: t('noClaimText'),
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
        noClaim,
        labels,
        goToHistory: () => navigate('/history'),
        goToFaq: () => navigate('/faq'),
        openSupport: () => window.open(supportUrl, '_blank', 'noopener,noreferrer'),
    }
}
