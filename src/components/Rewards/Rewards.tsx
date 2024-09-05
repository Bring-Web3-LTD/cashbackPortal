import styles from './styles.module.css'
import fetchCache from '../../api/fetchCache'

import { useRouteLoaderData, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import RewardsModal from '../Modals/RewardsModal/RewardsModal'
import { useState } from 'react'

const Rewards = () => {
    const navigate = useNavigate()
    const { walletAddress, platform } = useRouteLoaderData('root') as LoaderData
    const [modalState, setModalState] = useState('close')

    const { data: balance } = useQuery({
        queryFn: () => fetchCache({ walletAddress, platform }),
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })

    const eligibleTokenNumber = balance?.data?.totalPendings[0]?.tokenAmount || -1

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
    const currentCryptoSymbol = balance?.data?.totalPendings[0]?.tokenSymbol || ''
    const minimumClaimThreshold = balance?.data?.eligible[0]?.minimumClaimThreshold || -1

    console.log(minimumClaimThreshold);

    return (
        <div className={styles.container}>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <img className={styles.icon} src="/icons/gift.svg" alt="gift icon" />
                    <div className={`${styles.amount} ${styles.amount_claim}`}>{eligibleTokenAmount}</div>
                    <div>
                        <div className={`${styles.rewards_text} ${styles.claim_text}`}>Ready to claim</div>
                        <div className={`${styles.rewards_usd} ${styles.claim_usd}`}>Total value: {eligibleTotalEstimatedUsd}</div>
                    </div>
                </div>
                <button
                    className={`${styles.btn} ${styles.claim_btn}`}
                    onClick={() => setModalState('open')}
                    disabled={eligibleTokenNumber === -1 || minimumClaimThreshold === -1 || eligibleTokenNumber < minimumClaimThreshold}
                >
                    Claim cashback
                </button>
            </div>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <img className={styles.icon} src="/icons/coins.svg" alt="coins icon" />
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
                    View rewards
                </button>
            </div>
            <RewardsModal
                open={modalState !== 'close'}
                closeFn={() => setModalState('close')}
                eligibleTokenAmount={eligibleTokenAmount}
                currentCryptoSymbol={currentCryptoSymbol}
            />
        </div>
    )
}

export default Rewards