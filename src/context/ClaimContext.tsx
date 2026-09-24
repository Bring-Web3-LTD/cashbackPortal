/**
 * Owns the claim flow for the desktop portal: the signature round-trip with the
 * wallet, the status modal it drives, and whether claiming is available at all.
 *
 * A provider rather than a plain hook because the flow answers the wallet's
 * SIGNATURE message. More than one surface offers the action - the claimable
 * card and the What's This modal - and two copies of the listener would each
 * answer that message and submit the same claim twice.
 */
import { createContext, useEffect, useState, ReactNode } from 'react'
import { useRouteLoaderData, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import StatusModal, { type StatusModalState } from '../components/Modals/StatusModal/StatusModal'
import claimInitiate from '../api/claim/initiate'
import claimSubmit from '../api/claim/submit'
import message from '../utils/message'
import { useAnalytics } from '../hooks/useAnalytics'
import { useWalletAddress } from '../hooks/useWalletAddress'
import { useBalance, selectEligible } from '../hooks/useBalance'
import { formatCurrency } from '../pages/History/helpers'
import { ENV } from '../config'

export interface ClaimContextType {
    /** Starts the claim, or opens the guide when there is no wallet to sign. */
    claim: () => void
    /** No balance row, no threshold, under the threshold, or already claiming. */
    claimDisabled: boolean
    loading: boolean
}

export const ClaimContext = createContext<ClaimContextType | undefined>(undefined)

export const ClaimProvider = ({ children }: { children: ReactNode }) => {
    const { platform, cryptoSymbols, userId, flowId, isHub, chromeStoreUrl } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { sendAnalyticsEvent } = useAnalytics()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    const limit = searchParams.get('limit') || Infinity

    const [modalState, setModalState] = useState('close')
    const [claimStatus, setClaimStatus] = useState<StatusModalState>('loading')
    const [loading, setLoading] = useState(false)

    const { data: balance, isLoading } = useBalance()
    const eligible = selectEligible(balance)

    const currentCryptoSymbol = eligible?.tokenSymbol || cryptoSymbols[0]
    const minimumClaimThreshold = eligible?.minimumClaimThreshold ?? -1
    const eligibleTokenNumber = eligible?.tokenAmount ?? -1
    const claimAmount = ENV === 'prod' ? eligibleTokenNumber : Math.min(eligibleTokenNumber, +limit)

    // Rounding the raw number renders 0.006 as "0.01", which reads as claimable
    // when it is under the minimum - so the guide shows the backend's string.
    const eligibleTokenAmount = eligible?.tokenAmountDisplay ?? '0.00'
    const eligibleTotalEstimatedUsd = formatCurrency(eligible?.totalEstimatedUsd ?? 0)

    const claimDisabled =
        isLoading ||
        eligibleTokenNumber === -1 ||
        minimumClaimThreshold === -1 ||
        eligibleTokenNumber < minimumClaimThreshold ||
        loading

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.to !== 'bringweb3' || event.origin === window.location.origin) {
                return; // Ignore messages from untrusted origins
            }
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

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimAmount, currentCryptoSymbol, platform, queryClient, sendAnalyticsEvent, walletAddress]);

    // Asks the API for the message to sign, then hands it to the parent page.
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

    // No wallet to sign with in the hub, so claiming there opens the guide to
    // installing one rather than starting a signature that cannot finish.
    const claim = () => {
        if (!isHub) return signMessage()
        setClaimStatus('claim')
        setModalState('open')
    }

    return (
        <ClaimContext.Provider value={{ claim, claimDisabled, loading }}>
            {children}
            <StatusModal
                status={claimStatus}
                amount={claimStatus === 'claim'
                    ? `${eligibleTokenAmount} ${currentCryptoSymbol}`
                    : `${claimAmount} ${currentCryptoSymbol}`}
                usdValue={eligibleTotalEstimatedUsd || undefined}
                claimUrl={chromeStoreUrl}
                address={walletAddress}
                open={modalState !== 'close'}
                closeFn={() => {
                    setModalState('close')
                    setClaimStatus('loading')
                }}
            />
        </ClaimContext.Provider>
    )
}
