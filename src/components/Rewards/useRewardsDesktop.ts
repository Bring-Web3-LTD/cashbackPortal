/**
 * Logic hook for the desktop Rewards block. Owns the balance projection, the
 * per-card fit measurement, the minimum-claim tooltip and the navigation
 * handlers, and resolves the labels — so the view is pure UI.
 *
 * Named for the surface because `useRewards` is the mobile block's hook; the
 * two render different layouts from the same query.
 */
import { useCallback, useEffect, useRef, useState, KeyboardEvent, MouseEvent } from 'react'
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../pages/History/helpers'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { useBalance, selectEligible, selectPending } from '../../hooks/useBalance'
import { useClaim } from '../../hooks/useClaim'

// Floors from the design. The badge hugs its text, so its width is measured
// rather than assumed — a shorter value moves the hide point down.
const VALUES_MIN_WIDTH = 122
const BADGE_GAP = 13
const CTA_GAP = 20
const CTA_MIN_WIDTH = 80

/**
 * Drops a summary card's parts once they no longer fit: the badge first, then
 * the CTA. Flexbox does the shrinking; this only decides what stays mounted.
 */
const useCardFit = () => {
    const ref = useRef<HTMLDivElement>(null)
    const amountRef = useRef<HTMLDivElement>(null)
    const badgeRef = useRef<HTMLDivElement>(null)
    // Survives the badge unmounting, so its width is still known when deciding
    // whether it can come back.
    const badgeWidth = useRef(0)
    const [fit, setFit] = useState({ action: true, badge: true })

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new ResizeObserver(([entry]) => {
            if (badgeRef.current) badgeWidth.current = badgeRef.current.offsetWidth

            // contentRect excludes the card's padding, so the 22/18 are already out.
            const available = entry.contentRect.width
            const left = Math.max(VALUES_MIN_WIDTH, amountRef.current?.scrollWidth ?? 0)

            setFit({
                action: available >= left + CTA_GAP + CTA_MIN_WIDTH,
                badge: available >= left + BADGE_GAP + badgeWidth.current + CTA_GAP + CTA_MIN_WIDTH,
            })
        })

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return { ref, amountRef, badgeRef, fit }
}

export const useRewardsDesktop = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { cryptoSymbols, autoclaim } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    // The signature round-trip and the status modal it drives live in one
    // place, because the What's This modal offers the same action.
    const { claim, claimDisabled, loading } = useClaim()

    const { data: balance } = useBalance()
    const eligible = selectEligible(balance)
    const pending = selectPending(balance)

    const currentCryptoSymbol = eligible?.tokenSymbol || cryptoSymbols[0]
    const minimumClaimThreshold = eligible?.minimumClaimThreshold ?? -1

    // Rounding the raw number renders 0.006 as "0.01", which reads as
    // claimable when it is under the minimum.
    const eligibleTokenAmount = eligible?.tokenAmountDisplay ?? '0.00'
    const eligibleTotalEstimatedUsd = formatCurrency(eligible?.totalEstimatedUsd ?? 0)
    const pendingTokenAmount = pending?.tokenAmountDisplay ?? '0.00'
    const pendingTotalEstimatedUsd = formatCurrency(pending?.totalEstimatedUsd ?? 0)

    const pendingCard = useCardFit()
    const claimableCard = useCardFit()

    const [loginOpen, setLoginOpen] = useState(false)

    // The bottom card opens the ledger; the details button opens the same page
    // showing only what the two reward cards above it count.
    const openHistory = (rewardsOnly = false) =>
        walletAddress ? navigate('/history', { state: { rewardsOnly } }) : setLoginOpen(true)

    // Anchored to the claim trigger's rect: the card clips its overflow and
    // its container-type makes it a containing block, so the tooltip cannot
    // live inside it.
    const [tooltipAt, setTooltipAt] = useState<{ left: number; top: number } | null>(null)

    useEffect(() => {
        if (!tooltipAt) return
        const close = () => setTooltipAt(null)
        const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') close() }
        document.addEventListener('pointerdown', close)
        document.addEventListener('keydown', onKey)
        window.addEventListener('scroll', close, true)
        return () => {
            document.removeEventListener('pointerdown', close)
            document.removeEventListener('keydown', onKey)
            window.removeEventListener('scroll', close, true)
        }
    }, [tooltipAt])

    // Nothing to press while the claim is under the minimum, so the reason
    // surfaces on hover instead of on a click the disabled control should not
    // be inviting. Empty while it is claimable, so the card takes no handlers.
    const tooltipHandlers = claimDisabled ? {
        onMouseEnter: (e: MouseEvent<HTMLDivElement>) => {
            const r = e.currentTarget.getBoundingClientRect()
            setTooltipAt({ left: r.left + r.width / 2, top: r.top })
        },
        onMouseLeave: () => setTooltipAt(null),
    } : {}

    // Only take over the click while the pill is hidden; otherwise the pill
    // stays the control and the card must not double-handle it. Standing in
    // for the pill means standing in for all of it - a card that replaces a
    // disabled button is inert too, and one that replaces a live button is
    // reachable by keyboard the same way.
    const cardAction = useCallback((compact: boolean, onClick: () => void, disabled = false) => {
        if (!compact || disabled) return {}
        return {
            onClick,
            role: 'button',
            tabIndex: 0,
            style: { cursor: 'pointer' },
            onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                onClick()
            },
        }
    }, [])

    const labels = {
        pending: t('pending'),
        claimable: t('claimable'),
        details: t('details'),
        claim: t('claim'),
        historyCard: t('historyCard'),
        minimumClaim: t('minimumClaimTooltip', {
            amount: minimumClaimThreshold,
            symbol: currentCryptoSymbol,
        }),
    }

    return {
        isAutoClaim: autoclaim,
        claim,
        claimDisabled,
        loading,
        pendingCard,
        claimableCard,
        currentCryptoSymbol,
        pendingTokenAmount,
        pendingTotalEstimatedUsd,
        eligibleTokenAmount,
        eligibleTotalEstimatedUsd,
        cardAction,
        openHistory,
        tooltipAt,
        // The threshold is unknown until the balance lands; no number, no tip.
        showTooltip: Boolean(tooltipAt) && minimumClaimThreshold > 0,
        tooltipHandlers,
        loginOpen,
        closeLogin: () => setLoginOpen(false),
        labels,
    }
}
