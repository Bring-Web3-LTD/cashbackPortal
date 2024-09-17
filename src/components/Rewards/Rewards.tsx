import styles from './styles.module.css'
import fetchCache from '../../api/fetchCache'
import StatusModal from '../Modals/StatusModal/StatusModal'
import { useRouteLoaderData, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import claimSubmit from '../../api/claim/submit'
import claimInitiate from '../../api/claim/initiate'
import { Oval } from 'react-loader-spinner'
import message from '../../utils/message'

const Rewards = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { walletAddress, platform, iconsPath } = useRouteLoaderData('root') as LoaderData
    const [modalState, setModalState] = useState('close')
    const [claimStatus, setClaimStatus] = useState<'success' | 'failure'>('success')
    const [loading, setLoading] = useState(false)

    const { data: balance } = useQuery({
        queryFn: () => fetchCache({ walletAddress, platform }),
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })
    const currentCryptoSymbol = balance?.data?.eligible[0]?.tokenSymbol || ''
    const minimumClaimThreshold = balance?.data?.eligible[0]?.minimumClaimThreshold || -1
    const eligibleTokenNumber = balance?.data?.eligible[0]?.tokenAmount || -1

    useEffect(() => {
        // Define the message handler
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.from !== 'bringweb3' || event.origin === window.location.origin) {
                return; // Ignore messages from untrusted origins
            }
            // Handle the message data here
            if (event.data.action === 'SIGNATURE') {
                const body: Parameters<typeof claimSubmit>[0] = {
                    walletAddress,
                    targetWalletAddress: walletAddress,
                    tokenSymbol: currentCryptoSymbol,
                    tokenAmount: eligibleTokenNumber,
                    signature: event.data.signature,
                    message: event.data.message,
                    platform
                }
                if (event.data.key) body.key = event.data.key
                const res = await claimSubmit(body)
                console.log({ res });

                if (res.status === 202) {
                    setClaimStatus('success')
                } else {
                    setClaimStatus('failure')
                }
                setModalState('open')
                setLoading(false)
            } else if (event.data.action === 'ABORT') {
                setLoading(false)
            }
        };

        // Set up the event listener
        window.addEventListener('message', handleMessage);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [currentCryptoSymbol, eligibleTokenNumber, loading, platform, walletAddress]);

    // Get the message to sign from the API and post a message to parent page a request to sign the message
    const signMessage = async () => {
        setLoading(true)
        const res = await claimInitiate({
            platform,
            walletAddress,
            targetWalletAddress: walletAddress,
            tokenSymbol: currentCryptoSymbol,
            tokenAmount: eligibleTokenNumber,
        })

        const messageToSign = res?.messageToSign

        if (!messageToSign) {
            setLoading(false)
            return
        }

        message({ message: messageToSign, action: 'SIGN_MESSAGE' })
    }

    const eligibleTokenAmount =
        balance?.data?.eligible[0]?.tokenAmount?.toLocaleString(undefined, {
            maximumFractionDigits: 2,
        }) || "0"

    const eligibleTotalEstimatedUsd =
        balance?.data?.eligible[0]?.totalEstimatedUsd?.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
        }) || "0"

    const pendingTokenAmount =
        balance?.data?.totalPendings[0]?.tokenAmount?.toLocaleString(undefined, {
            maximumFractionDigits: 2,
        }) || "0"

    const pendingTotalEstimatedUsd =
        balance?.data?.totalPendings[0]?.totalEstimatedUsd?.toLocaleString(
            undefined,
            {
                style: "currency",
                currency: "USD",
            },
        ) || "0"

    return (
        <div className={styles.container}>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <div className={`${styles.icon_container} ${styles.claim_icon}`}>
                        <img className={styles.icon} src={`${iconsPath}/gift.svg`} alt="gift icon" />
                    </div>
                    <div className={`${styles.amount} ${styles.amount_claim}`}>{eligibleTokenAmount}</div>
                    <div>
                        <div className={`${styles.rewards_text} ${styles.claim_text}`}>Ready to claim</div>
                        <div className={`${styles.rewards_usd} ${styles.claim_usd}`}>Total value: {eligibleTotalEstimatedUsd}</div>
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
                    <div className={`${styles.amount} ${styles.amount_pending}`}>{pendingTokenAmount}</div>
                    <div>
                        <div className={`${styles.rewards_text} ${styles.pending_text}`}>Pending rewards</div>
                        <div className={`${styles.rewards_usd} ${styles.pending_usd}`}>Total value: {pendingTotalEstimatedUsd}</div>
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
                closeFn={() => setModalState('close')}
            />
        </div>
    )
}

export default Rewards