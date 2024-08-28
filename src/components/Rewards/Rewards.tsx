import styles from './styles.module.css'
import fetchCache from '../../api/fetchCache'

import { useLoaderData } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Popup from '../Popup/Popup'
import { useState } from 'react'

const Rewards = () => {
    const { walletAddress, platform } = useLoaderData() as LoaderData
    const [popupStatus, setPopupStatus] = useState('close')

    const { data: balance } = useQuery({
        queryFn: () => fetchCache({ walletAddress, platform }),
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })

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
    const currentCryptoSymbol = balance?.data?.totalPendings[0]?.tokenSymbol
    // const minimumClaimThreshold = balance?.data?.eligible[0]?.minimumClaimThreshold

    return (
        <div className={styles.container}>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <img className={styles.icon} src="/icons/gift.svg" alt="gift icon" />
                    <div className={`${styles.amount} ${styles.amount_claim}`}>{eligibleTokenAmount}</div>
                    <div>
                        <div className={styles.reward_type}>Ready to claim</div>
                        <div className={styles.usd_amount}>Total value: {eligibleTotalEstimatedUsd}</div>
                    </div>
                </div>
                <button
                    className={`${styles.btn} ${styles.claim_btn}`}
                    onClick={() => setPopupStatus('open')}
                >
                    Claim cashback
                </button>
            </div>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <img className={styles.icon} src="/icons/coins.svg" alt="coins icon" />
                    <div className={`${styles.amount} ${styles.amount_pending}`}>{pendingTokenAmount}</div>
                    <div>
                        <div className={styles.reward_type}>Pending rewards</div>
                        <div className={styles.usd_amount}>Total value: {pendingTotalEstimatedUsd}</div>
                    </div>
                </div>
                <button className={`${styles.btn} ${styles.pending_btn}`}>View rewards</button>
            </div>
            <Popup
                open={popupStatus !== 'close'}
                closeFn={() => setPopupStatus('close')}
            >
                <div className={styles.popup}>
                    <div className={styles.title}>Claim to your wallet</div>
                    <div className={styles.claim_amount}>{eligibleTokenAmount} {currentCryptoSymbol}</div>
                    <div className={styles.details}>
                        <div className={styles.wallet_address_title}>Wallet address</div>
                        <div className={styles.wallet_address}>{walletAddress}</div>
                        <p className={styles.disclaimer}>
                            By proceeding you acknowledge that we are not liable for any token loss during this onboarding process
                        </p>
                    </div>
                    <img
                        src="icons/claim.svg"
                        className={styles.popup_img}
                        alt="claim icon"
                    />
                    <div className={styles.sml_text}>Click "Sign now" and sign the message received on your wallet</div>
                    <button className={styles.sign_btn}>
                        Sign now
                    </button>
                </div>
            </Popup>
        </div>
    )
}

export default Rewards