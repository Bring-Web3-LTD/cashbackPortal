import styles from './styles.module.css'
import { useRouteLoaderData, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Oval } from 'react-loader-spinner'
import { formatCurrency } from '../../pages/History/helpers'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { useBalance, selectEligible, selectPending } from '../../hooks/useBalance'
import { useClaim } from '../../hooks/useClaim'
import LoginModal from '../Modals/LoginModal/LoginModal'


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

const Rewards = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { cryptoSymbols, autoclaim } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [loginModalState, setLoginModalState] = useState('close')
    const isAutoClaim = autoclaim
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

    // Anchored to the claim trigger's rect: the card clips its overflow and
    // its container-type makes it a containing block, so the tooltip cannot
    // live inside it.
    const [tooltipAt, setTooltipAt] = useState<{ left: number; top: number } | null>(null)

    const pendingCard = useCardFit()
    const claimableCard = useCardFit()

    // Only take over the click while the pill is hidden; otherwise the pill
    // stays the control and the card must not double-handle it. Standing in
    // for the pill means standing in for all of it - a card that replaces a
    // disabled button is inert too, and one that replaces a live button is
    // reachable by keyboard the same way.
    const cardAction = (compact: boolean, onClick: () => void, disabled = false) => {
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
    }

    // The bottom card opens the ledger; the details button opens the same page
    // showing only what the two reward cards above it count.
    const openHistory = (rewardsOnly = false) =>
        walletAddress ? navigate('/history', { state: { rewardsOnly } }) : setLoginModalState('open')

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

    return (
        <>
            <div
                ref={pendingCard.ref}
                className={styles.card}
                {...cardAction(!pendingCard.fit.action, () => openHistory(true))}
            >
                <div className={styles.left_cluster}>
                    <div className={styles.values}>
                        <div className={styles.card_label}>{t('pending')}</div>
                        <div ref={pendingCard.amountRef} className={styles.amount_row}>
                            <span>{pendingTokenAmount}</span>
                            <span>{currentCryptoSymbol}</span>
                        </div>
                    </div>
                    {pendingCard.fit.badge ? (
                        <div ref={pendingCard.badgeRef} className={styles.badge}>{pendingTotalEstimatedUsd}</div>
                    ) : null}
                </div>
                {pendingCard.fit.action ? (
                    <button
                        id="rewards-view-btn"
                        className={styles.card_btn}
                        onClick={() => openHistory(true)}
                    >
                        {t('details')}
                    </button>
                ) : null}
            </div>
            {!isAutoClaim ?
                <div
                    ref={claimableCard.ref}
                    className={`${styles.card} ${claimDisabled ? styles.card_disabled : ''}`}
                    {...cardAction(!claimableCard.fit.action, claim, claimDisabled)}
                    // Nothing to press while the claim is under the minimum, so
                    // the reason surfaces on hover instead of on a click the
                    // disabled control should not be inviting.
                    onMouseEnter={claimDisabled ? (e) => {
                        const r = e.currentTarget.getBoundingClientRect()
                        setTooltipAt({ left: r.left + r.width / 2, top: r.top })
                    } : undefined}
                    onMouseLeave={claimDisabled ? () => setTooltipAt(null) : undefined}
                >
                    <div className={styles.left_cluster}>
                        <div className={styles.values}>
                            <div className={styles.card_label}>{t('claimable')}</div>
                            <div ref={claimableCard.amountRef} className={styles.amount_row}>
                                <span>{eligibleTokenAmount}</span>
                                <span>{currentCryptoSymbol}</span>
                            </div>
                        </div>
                        {claimableCard.fit.badge ? (
                            <div ref={claimableCard.badgeRef} className={styles.badge}>{eligibleTotalEstimatedUsd}</div>
                        ) : null}
                    </div>
                    {claimableCard.fit.action ? (
                    <button
                        id="rewards-claim-btn"
                        className={styles.card_btn}
                        onClick={claim}
                        disabled={claimDisabled}
                    >
                        {loading ?
                            // Oval writes `color` straight into the SVG `stroke`
                            // attribute, where a var() never resolves — so the
                            // theme drives it through the wrapper's `color`.
                            <span className={styles.loader}>
                                <Oval
                                    visible={true}
                                    height="20"
                                    width="20"
                                    color="currentColor"
                                    secondaryColor='grey'
                                    strokeWidth={6}
                                    ariaLabel="oval-loading"
                                />
                            </span>
                            : t('claim')}
                    </button>
                    ) : null}
                </div>
                : null}
            <button
                id="rewards-history-btn"
                className={styles.history_card}
                onClick={() => openHistory()}
            >
                {t('historyCard')}
            </button>
            {tooltipAt && minimumClaimThreshold > 0 && (
                <div
                    role="tooltip"
                    className={styles.tooltip}
                    style={{ left: tooltipAt.left, top: tooltipAt.top }}
                >
                    {t('minimumClaimTooltip', { amount: minimumClaimThreshold, symbol: currentCryptoSymbol })}
                </div>
            )}
            <LoginModal
                closeFn={() => setLoginModalState('close')}
                open={loginModalState !== 'close'}
            />
        </>
    )
}

export default Rewards
