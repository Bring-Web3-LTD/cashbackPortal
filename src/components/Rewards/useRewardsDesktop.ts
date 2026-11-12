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
import { useRequestIdentity } from '../../hooks/useRequestIdentity'
import { useBalance, selectEligible, selectPending } from '../../hooks/useBalance'
import { useClaim } from '../../hooks/useClaim'

// Floors from the Figma master (Summary Card v2 - CORE). The name, the badge
// and the button hug their text, so their widths are measured rather than
// assumed.
const VALUES_MIN_WIDTH = 120
const ROW_GAP = 8
const CTA_GAP = 20
const CTA_MIN_WIDTH = 70

/**
 * Drops a summary card's parts once they no longer fit, in the design's order:
 * the $ badge, then the asset name, then the CTA. The token amount never
 * drops. Flexbox does the shrinking; this only decides what stays mounted.
 */
const useCardFit = (hasName: boolean) => {
    const ref = useRef<HTMLDivElement>(null)
    const amountRef = useRef<HTMLSpanElement>(null)
    const nameRef = useRef<HTMLSpanElement>(null)
    const badgeRef = useRef<HTMLSpanElement>(null)
    const actionRef = useRef<HTMLButtonElement>(null)
    // Survive their part unmounting, so its width is still known when deciding
    // whether it can come back.
    const nameWidth = useRef(0)
    const badgeWidth = useRef(0)
    const actionWidth = useRef(CTA_MIN_WIDTH)
    const [fit, setFit] = useState({ action: true, name: true, badge: true })

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new ResizeObserver(([entry]) => {
            if (nameRef.current) nameWidth.current = nameRef.current.offsetWidth
            if (badgeRef.current) badgeWidth.current = badgeRef.current.offsetWidth
            if (actionRef.current) actionWidth.current = actionRef.current.offsetWidth

            // contentRect excludes the card's padding, so the 20/20 are already out.
            const available = entry.contentRect.width
            const amount = amountRef.current?.offsetWidth ?? 0
            const name = hasName ? nameWidth.current + ROW_GAP : 0
            const badge = badgeWidth.current + ROW_GAP
            const action = Math.max(CTA_MIN_WIDTH, actionWidth.current)
            const fits = (row: number) =>
                available >= Math.max(VALUES_MIN_WIDTH, row) + CTA_GAP + action

            setFit({
                badge: fits(name + amount + badge),
                name: fits(name + amount),
                action: fits(amount),
            })
        })

        observer.observe(el)
        return () => observer.disconnect()
    }, [hasName])

    return { ref, amountRef, nameRef, badgeRef, actionRef, fit }
}

const toCard = (token: Token | undefined, fallbackSymbol: string) => ({
    // Rounding the raw number renders 0.006 as "0.01", which reads as
    // claimable when it is under the minimum.
    amount: token?.tokenAmountDisplay ?? '0.00',
    symbol: token?.tokenSymbol || fallbackSymbol,
    name: token?.displayName ?? null,
    usd: formatCurrency(token?.totalEstimatedUsd ?? 0),
})

export const useRewardsDesktop = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { cryptoSymbols, autoclaim, noClaim } = useRouteLoaderData('root') as LoaderData
    const { isIdentified } = useRequestIdentity()
    // The signature round-trip and the status modal it drives live in one
    // place, because the What's This modal offers the same action.
    const { claim, claimDisabled, loading } = useClaim()

    const { data: balance } = useBalance()
    const eligible = selectEligible(balance)
    const pending = selectPending(balance)

    const currentCryptoSymbol = eligible?.tokenSymbol || cryptoSymbols[0]
    const minimumClaimThreshold = eligible?.minimumClaimThreshold ?? -1

    const pendingValues = toCard(pending, currentCryptoSymbol)
    const claimableValues = toCard(eligible, currentCryptoSymbol)

    const pendingCard = useCardFit(pendingValues.name !== null)
    const claimableCard = useCardFit(claimableValues.name !== null)
    // The tooltip points at the pill, but the pill is disabled and so takes no
    // pointer events - the card is what hears the hover. Measure the pill
    // through the fit's ref rather than from the event's target.
    const claimBtnRef = claimableCard.actionRef

    const [loginOpen, setLoginOpen] = useState(false)

    // The bottom card opens the ledger; the details button opens the same page
    // showing only what the two reward cards above it count.
    // Needs a wallet, except in the hub, where the balance comes from the session cookie.
    const openHistory = (rewardsOnly = false) =>
        isIdentified ? navigate('/history', { state: { rewardsOnly } }) : setLoginOpen(true)

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
            // Falls back to the card, which is the trigger once it is too
            // narrow for the pill and the pill is no longer rendered.
            const el = claimBtnRef.current ?? e.currentTarget
            const r = el.getBoundingClientRect()
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
        // A noClaim platform pays out itself: approved rewards are saved. The
        // Claim button stays and opens the coming-soon dialog (ClaimContext).
        claimable: noClaim ? t('approved') : t('claimable'),
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
        pendingValues,
        claimableValues,
        claimBtnRef,
        cardAction,
        openHistory,
        tooltipAt,
        // Only when there is a balance the minimum is holding back. With
        // nothing to claim - before the first reward, or straight after a
        // claim empties it - the threshold is not the reason the button is
        // disabled, so naming it reads as an error. Same rule as the mobile
        // block's belowMinimum. No threshold yet means no number to show.
        showTooltip:
            Boolean(tooltipAt) &&
            minimumClaimThreshold > 0 &&
            (eligible?.tokenAmount ?? 0) > 0,
        tooltipHandlers,
        loginOpen,
        closeLogin: () => setLoginOpen(false),
        labels,
    }
}
