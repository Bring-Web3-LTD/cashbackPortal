/**
 * Logic hook for the ClaimModal. Owns the emoji-fallback state, the
 * body-scroll-lock + popup-message effect, and derives the resolved token /
 * formatted amount / short address / per-state title so the view is pure UI.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../utils/message'
import {
    formatSignedAmount,
    ClaimModalState,
    shortenWalletAddress,
} from '../../utils/claimFlow'

export interface ClaimModalProps {
    state: ClaimModalState | null
    tokenSymbol: string
    tokenAmountDisplay: string
    tokenAmount: number
    minimumClaimThreshold: number
    walletAddress: string | null
    /** Wallet display name from the backend token (verify response). */
    walletName?: string
    /** Wallet emoji asset URL from the backend token (verify response). */
    walletEmoji?: string
    explorerLink: string | null
    onClose: () => void
    onConfirm: () => void
    onTryAgain: () => void
}

export const useClaimModal = ({
    state,
    tokenSymbol,
    tokenAmountDisplay,
    tokenAmount,
    walletAddress,
    walletEmoji,
}: ClaimModalProps) => {
    const { t } = useTranslation()
    const { cryptoTokens } = useRouteLoaderData('root') as LoaderData
    const cryptoToken = cryptoTokens?.find(ct => ct.symbol === tokenSymbol)
    const open = !!state

    // Fall back to the default emoji icon if the provided emoji URL fails to load.
    const [emojiFailed, setEmojiFailed] = useState(false)
    useEffect(() => { setEmojiFailed(false) }, [walletEmoji])

    useEffect(() => {
        if (!open) return
        const { documentElement: html, body } = document
        const prevHtml = html.style.overflow
        const prevBody = body.style.overflow
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        message({ action: 'POPUP_OPENED', overlayBgColor: 'rgba(15, 15, 26, 0.75)' })

        return () => {
            html.style.overflow = prevHtml
            body.style.overflow = prevBody
            message({ action: 'POPUP_CLOSED' })
        }
    }, [open])

    const signedAmount = formatSignedAmount(tokenAmountDisplay, tokenAmount)
    const shortAddress = shortenWalletAddress(walletAddress)

    const titles: Record<ClaimModalState, string> = {
        confirm: t('claimRewardsTitle') || 'Claim Rewards',
        minimum: t('minimumClaimTitle') || 'Minimum Claim',
        success: t('rewardClaimedHeader') || 'Reward claimed',
        failure: t('claimRewardsTitle') || 'Claim Rewards',
        processing: t('claimingHeader') || 'Claiming',
    }
    const title = state ? titles[state] : ''

    return {
        t,
        open,
        cryptoToken,
        emojiFailed,
        onEmojiError: () => setEmojiFailed(true),
        signedAmount,
        shortAddress,
        title,
    }
}
