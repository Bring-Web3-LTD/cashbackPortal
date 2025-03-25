import styles from './styles.module.css'
import fetchCache from '../../api/fetchCache'
import StatusModal from '../Modals/StatusModal/StatusModal'
import { useRouteLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import claimSubmit from '../../api/claim/submit'
import claimInitiate from '../../api/claim/initiate'
import { Oval } from 'react-loader-spinner'
import message from '../../utils/message'
import { useQueryClient } from '@tanstack/react-query'
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { formatCurrency } from '../../pages/History/helpers'
import { ENV } from '../../config'

const Rewards = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { sendGaEvent } = useGoogleAnalytics()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    const { walletAddress, platform, iconsPath, cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const [modalState, setModalState] = useState('close')
    const [claimStatus, setClaimStatus] = useState<'success' | 'failure' | 'loading'>('loading')
    const [loading, setLoading] = useState(false)
    const limit = searchParams.get('limit') || '14'

    const { data: balance } = useQuery({
        queryFn: () => fetchCache({ walletAddress, platform }),
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })
    const currentCryptoSymbol = balance?.data?.eligible[0]?.tokenSymbol || ''
    const minimumClaimThreshold = balance?.data?.eligible[0]?.minimumClaimThreshold || -1
    const eligibleTokenNumber = balance?.data?.eligible[0]?.tokenAmount || -1
    const claimAmount = ENV === 'prod' ? eligibleTokenNumber : ((limit ? +limit : null) || eligibleTokenNumber)

    useEffect(() => {
        // Define the message handler
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.to !== 'bringweb3' || event.origin === window.location.origin) {
                return; // Ignore messages from untrusted origins
            }
            // Handle the message data here
            if (event.data.action === 'SIGNATURE') {
                sendGaEvent('claim_submit', {
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
                    platform
                }
                if (event.data.key) body.key = event.data.key
                const res = await claimSubmit(body)

                if (res.status === 202) {
                    setClaimStatus('success')
                    sendGaEvent('claim_accepted', {
                        category: 'system',
                        action: 'request',
                        details: claimAmount,
                    })
                    queryClient.invalidateQueries({ queryKey: ["balance", walletAddress] })
                } else {
                    setClaimStatus('failure')
                    sendGaEvent('claim_failed', {
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
    }, [claimAmount, currentCryptoSymbol, eligibleTokenNumber, loading, platform, queryClient, sendGaEvent, walletAddress]);

    // Get the message to sign from the API and post a message to parent page a request to sign the message
    const signMessage = async () => {
        setLoading(true)

        const res = await claimInitiate({
            platform,
            walletAddress,
            targetWalletAddress: walletAddress,
            tokenSymbol: currentCryptoSymbol,
            tokenAmount: claimAmount,
        })

        sendGaEvent('claim_open', {
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

    const eligibleTokenAmount =
        (balance?.data?.eligible[0]?.tokenAmount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            // minimumFractionDigits: balance?.data?.eligible[0]?.tokenAmount ? 0 : 2,
            maximumFractionDigits: 2,
        })

    const eligibleTotalEstimatedUsd = formatCurrency(balance?.data?.eligible[0]?.totalEstimatedUsd ?? 0)
    // (balance?.data?.eligible[0]?.totalEstimatedUsd ?? 0).toLocaleString(undefined, {
    //     style: "currency",
    //     currency: "USD",
    // })

    const pendingTokenAmount =
        (balance?.data?.totalPendings[0]?.tokenAmount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            // minimumFractionDigits: balance?.data?.totalPendings[0]?.tokenAmount ? 0 : 2,
            maximumFractionDigits: 2,
        })

    const pendingTotalEstimatedUsd = formatCurrency(balance?.data?.totalPendings[0]?.totalEstimatedUsd ?? 0)

    return (
        <div className={styles.container}>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <div className={`${styles.icon_container} ${styles.claim_icon}`}>
                        <img
                            className={styles.icon}
                            src={`${iconsPath}/gift.svg`}
                            alt="gift icon"
                        />
                    </div>
                    <div className={styles.reward_details_subcontainer}>
                        <div className={`${styles.amount} ${styles.amount_claim}`}>
                            {balance?.data?.eligible[0]?.tokenAmount ? `${eligibleTokenAmount} ${currentCryptoSymbol}` : `0 ${cryptoSymbols[0]}`}
                        </div>
                        <div className={`${styles.rewards_usd} ${styles.claim_usd}`}>
                            {+eligibleTokenAmount.split(/\s/)[0] < minimumClaimThreshold ?
                                `Minimum claim amount: ${minimumClaimThreshold} ${currentCryptoSymbol}`
                                :
                                `Current value: ${eligibleTotalEstimatedUsd}`
                            }

                        </div>
                    </div>
                </div>
                <button
                    className={`${styles.btn} ${styles.claim_btn}`}
                    onClick={() => signMessage()}
                    disabled={eligibleTokenNumber === -1 || minimumClaimThreshold === -1 || eligibleTokenNumber < minimumClaimThreshold || loading}
                >
                    {
                        loading ?
                            <Oval
                                visible={true}
                                height="20"
                                width="20"
                                color="#fff"
                                secondaryColor='grey'
                                strokeWidth={6}
                                ariaLabel="oval-loading"
                            />
                            :
                            t('claimCashback')
                    }
                </button>
            </div>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <div className={`${styles.icon_container} ${styles.pending_icon}`}>
                        <img className={styles.icon} src={`${iconsPath}/coins.svg`} alt="coins icon" />
                    </div>
                    <div className={styles.reward_details_subcontainer}>
                        <div className={`${styles.amount} ${styles.amount_pending}`}>
                            {balance?.data?.totalPendings[0]?.tokenAmount ? `${pendingTokenAmount} ${currentCryptoSymbol}` : `0 ${cryptoSymbols[0]}`}
                        </div>

                        <div className={`${styles.rewards_usd} ${styles.pending_usd}`}>Current value: {pendingTotalEstimatedUsd}</div>
                    </div>
                </div>
                <button
                    className={`${styles.btn} ${styles.pending_btn}`}
                    onClick={() => navigate('/history')}
                >
                    {t('viewRewards')}
                </button>
            </div>
            <StatusModal
                status={claimStatus}
                open={modalState !== 'close'}
                closeFn={() => {
                    setModalState('close')
                    setClaimStatus('loading')
                }}
            />
        </div>
    )
}

export default Rewards