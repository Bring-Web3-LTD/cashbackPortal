import styles from './styles.module.css'
import fetchCache from '../../api/fetchCache'
import StatusModal from '../Modals/StatusModal/StatusModal'
import { useRouteLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import claimSubmit from '../../api/claim/submit'
import claimInitiate from '../../api/claim/initiate'
import { Oval } from 'react-loader-spinner'
import message from '../../utils/message'
import { useQueryClient } from '@tanstack/react-query'
import { useAnalytics } from '../../hooks/useAnalytics'
import { formatCurrency } from '../../pages/History/helpers'
import { ENV } from '../../config'
import { useWalletAddress } from '../../hooks/useWalletAddress'
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
    const { sendAnalyticsEvent } = useAnalytics()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    const { platform, cryptoSymbols, userId, flowId, autoclaim } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [modalState, setModalState] = useState('close')
    const [loginModalState, setLoginModalState] = useState('close')
    const [claimStatus, setClaimStatus] = useState<'success' | 'failure' | 'loading'>('loading')
    const [loading, setLoading] = useState(false)
    const isAutoClaim = autoclaim
    const limit = searchParams.get('limit') || Infinity

    const { data: balance } = useQuery({
        queryFn: async () => {
            const body: Parameters<typeof fetchCache>[0] = {
                platform,
                userId,
                flowId
            }

            if (walletAddress) body.walletAddress = walletAddress

            return await fetchCache(body)
        },
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })
    const currentCryptoSymbol = balance?.data?.eligible[0]?.tokenSymbol || cryptoSymbols[0]
    const minimumClaimThreshold = balance?.data?.eligible[0]?.minimumClaimThreshold || -1
    const eligibleTokenNumber = balance?.data?.eligible[0]?.tokenAmount || -1
    const claimAmount = ENV === 'prod' ? eligibleTokenNumber : Math.min(eligibleTokenNumber, +limit)

    useEffect(() => {
        // Define the message handler
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.to !== 'bringweb3' || event.origin === window.location.origin) {
                return; // Ignore messages from untrusted origins
            }
            // Handle the message data here
            if (event.data.action === 'SIGNATURE') {
                sendAnalyticsEvent('claim_submit', {
                    category: 'user_action',
                    details: claimAmount,
                    process: 'submit'
                })
                setModalState('open')
                const body: Parameters<typeof claimSubmit>[0] = {
                    walletAddress,
                    targetWalletAddress: walletAddress,
                    tokenSymbol: currentCryptoSymbol,
                    tokenAmount: claimAmount,
                    signature: event.data.signature,
                    message: event.data.message,
                    platform,
                    userId,
                    flowId
                }
                if (event.data.key) body.key = event.data.key
                const res = await claimSubmit(body)

                if (res?.ok) {
                    setClaimStatus('success')
                    sendAnalyticsEvent('claim_accepted', {
                        category: 'system',
                        action: 'request',
                        details: claimAmount,
                    })
                    queryClient.invalidateQueries({ queryKey: ["balance", walletAddress] })
                } else {
                    setClaimStatus('failure')
                    sendAnalyticsEvent('claim_failed', {
                        category: 'system',
                        action: 'request',
                        details: `${claimAmount}, ${res}`,
                    })
                }
                setLoading(false)
            } else if (event.data.action === 'ABORT_SIGN_MESSAGE') {
                setLoading(false)
            }
        };

        // Set up the event listener
        window.addEventListener('message', handleMessage);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('message', handleMessage);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimAmount, currentCryptoSymbol, eligibleTokenNumber, loading, platform, queryClient, sendAnalyticsEvent, walletAddress]);

    // Get the message to sign from the API and post a message to parent page a request to sign the message
    const signMessage = async () => {
        setLoading(true)

        const res = await claimInitiate({
            platform,
            walletAddress,
            targetWalletAddress: walletAddress,
            tokenSymbol: currentCryptoSymbol,
            tokenAmount: claimAmount,
            userId,
            flowId
        })

        sendAnalyticsEvent('claim_open', {
            category: 'user_action',
            action: 'click',
            details: claimAmount,
            process: 'initiate'
        })

        const messageToSign = res?.messageToSign

        if (!messageToSign) {
            setLoading(false)
            return
        }

        message({ messageToSign, amount: claimAmount, action: 'SIGN_MESSAGE', tokenSymbol: currentCryptoSymbol })
    }

    // Rounding the raw number renders 0.006 as "0.01", which reads as
    // claimable when it is under the minimum.
    const eligibleTokenAmount = balance?.data?.eligible[0]?.tokenAmountDisplay ?? '0.00'

    const eligibleTotalEstimatedUsd = formatCurrency(balance?.data?.eligible[0]?.totalEstimatedUsd ?? 0)

    const pendingTokenAmount = balance?.data?.totalPendings[0]?.tokenAmountDisplay ?? '0.00'

    const pendingTotalEstimatedUsd = formatCurrency(balance?.data?.totalPendings[0]?.totalEstimatedUsd ?? 0)

    // Anchored to the claim trigger's rect: the card clips its overflow and
    // its container-type makes it a containing block, so the tooltip cannot
    // live inside it.
    const [tooltipAt, setTooltipAt] = useState<{ left: number; top: number } | null>(null)

    const pendingCard = useCardFit()
    const claimableCard = useCardFit()

    // Only take over the click while the pill is hidden; otherwise the pill
    // stays the control and the card must not double-handle it.
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

    const openHistory = () => walletAddress ? navigate('/history') : setLoginModalState('open')

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

    const claimDisabled = eligibleTokenNumber === -1 || minimumClaimThreshold === -1 || eligibleTokenNumber < minimumClaimThreshold || loading

    return (
        <>
            <div
                ref={pendingCard.ref}
                className={styles.card}
                {...cardAction(!pendingCard.fit.action, openHistory)}
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
                        onClick={openHistory}
                    >
                        {t('details')}
                    </button>
                ) : null}
            </div>
            {!isAutoClaim ?
                <div
                    ref={claimableCard.ref}
                    className={`${styles.card} ${claimDisabled ? styles.card_disabled : ''}`}
                    onClick={(e) => {
                        if (!claimDisabled) return claimableCard.fit.action ? undefined : signMessage()
                        e.stopPropagation()
                        const r = e.currentTarget.getBoundingClientRect()
                        setTooltipAt({ left: r.left + r.width / 2, top: r.top })
                    }}
                    style={claimDisabled || !claimableCard.fit.action ? { cursor: 'pointer' } : undefined}
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
                        onClick={() => signMessage()}
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
                onClick={() => walletAddress ? navigate('/history') : setLoginModalState('open')}
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
            <StatusModal
                status={claimStatus}
                amount={`${claimAmount} ${currentCryptoSymbol}`}
                address={walletAddress}
                open={modalState !== 'close'}
                closeFn={() => {
                    setModalState('close')
                    setClaimStatus('loading')
                }}
            />
            <LoginModal
                closeFn={() => setLoginModalState('close')}
                open={loginModalState !== 'close'}
            />
        </>
    )
}

export default Rewards
