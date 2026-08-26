/**
 * Logic hook for the ClaimModal. Owns the emoji-fallback state, the
 * body-scroll-lock + popup-message effect, and derives the resolved token /
 * formatted amount / short address / per-state title so the view is pure UI.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../utils/message'
import { formatCurrency } from '../../pages/History/helpers'
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
    /** USD value of the claimable balance — shown on the instructions state. */
    totalEstimatedUsd?: number
    onClose: () => void
    onConfirm: () => void
    onTryAgain: () => void
}

export const useClaimModal = ({
    state,
    tokenSymbol,
    tokenAmountDisplay,
    tokenAmount,
    minimumClaimThreshold,
    walletAddress,
    walletName,
    walletEmoji,
    totalEstimatedUsd,
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
        confirm: t('claimRewardsTitle'),
        minimum: t('minimumClaimTitle'),
        success: t('rewardClaimedHeader'),
        failure: t('claimFailedHeader'),
        processing: t('claimingHeader'),
        instructions: t('claimTitle'),
    }
    const title = state ? titles[state] : ''

    // Resolve every label here so the view holds no i18n.
    const labels = {
        close: t('close'),
        confirm: t('confirm'),
        tryAgain: t('tryAgain'),
        claimIntro: t('claimIntro'),
        walletDisplay: walletName || t('address'),
        networkFee: t('networkFee'),
        networkFeeWaived: t('networkFeeWaived'),
        minimalAmountClaim: t('minimalAmountClaim'),
        minimumOnWayTitle: t('minimumOnWayTitle'),
        // `amount`/`symbol` let a platform phrase the threshold inline instead
        // of hardcoding it — Solflare's copy does, DEFAULT's ignores them.
        minimumOnWayMsg1: t('minimumOnWayMsg1', {
            amount: minimumClaimThreshold,
            symbol: tokenSymbol,
        }),
        minimumOnWayMsg2: t('minimumOnWayMsg2'),
        minimumKeepShopping: t('minimumKeepShopping'),
        claiming: t('claiming'),
        claimProcessingMsg: t('claimProcessingMsg'),
        claimProcessingMsg2: t('claimProcessingMsg2'),
        showInExplorer: t('showInExplorer'),
        rewardClaimedTitle: t('rewardClaimedTitle'),
        rewardClaimedMsg: t('rewardClaimedMsg', { address: shortAddress || walletName }),
        claimFailedTitle: t('claimFailedTitle'),
        claimFailedMsg: t('claimFailedMsg'),
        claimNow: t('claimNow'),
        yourBalance: t('yourBalance'),
        currentValue: `${t('currentValue')} ${formatCurrency(totalEstimatedUsd ?? 0)}`,
        claimYourToken: t('claimYourToken', { symbol: tokenSymbol }),
        downloadWallet: t('downloadWallet'),
    }

    const claimSteps = [
        t('claimStep1'),
        t('claimStep2'),
        t('claimStep3'),
        t('claimStep4'),
    ]

    return {
        labels,
        claimSteps,
        open,
        cryptoToken,
        emojiFailed,
        onEmojiError: () => setEmojiFailed(true),
        signedAmount,
        shortAddress,
        title,
    }
}
