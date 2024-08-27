import styles from './styles.module.css'
import { useLoaderData } from 'react-router-dom'
import fetchCache from '../../api/fetchCache'
import { useQuery } from '@tanstack/react-query'

const Rewards = () => {
    const { walletAddress, platform } = useLoaderData() as LoaderData

    const { data: balance } = useQuery({
        queryFn: () => fetchCache({ walletAddress, platform }),
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })

    // const eligibleTokenAmount =
    //     balance?.data?.eligible[0]?.tokenAmount?.toLocaleString(undefined, {
    //         maximumFractionDigits: 2,
    //     }) || "0"
    // const eligibleTotalEstimatedUsd =
    //     balance?.data?.eligible[0]?.totalEstimatedUsd?.toLocaleString(undefined, {
    //         style: "currency",
    //         currency: "USD",
    //     }) || "0"
    // const pendingTokenAmount =
    //     balance?.data?.totalPendings[0]?.tokenAmount?.toLocaleString(undefined, {
    //         maximumFractionDigits: 2,
    //     }) || "0"
    // const pendingTotalEstimatedUsd =
    //     balance?.data?.totalPendings[0]?.totalEstimatedUsd?.toLocaleString(
    //         undefined,
    //         {
    //             style: "currency",
    //             currency: "USD",
    //         },
    //     ) || "0"
    // const minimumClaimThreshold =
    //     balance?.data?.eligible[0]?.minimumClaimThreshold

    console.log(balance);

    return (
        <div className={styles.container}>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <img className={styles.icon} src="/icons/gift.svg" alt="gift icon" />
                    <div className={`${styles.amount} ${styles.amount_claim}`}>153.4</div>
                    <div>
                        <div className={styles.reward_type}>Ready to claim</div>
                        <div className={styles.usd_amount}>Total value: $45.55</div>
                    </div>
                </div>
                <button className={`${styles.btn} ${styles.claim_btn}`}>Claim cashback</button>
            </div>
            <div className={styles.subcontainer}>
                <div className={styles.reward_details}>
                    <img className={styles.icon} src="/icons/coins.svg" alt="coins icon" />
                    <div className={`${styles.amount} ${styles.amount_pending}`}>458.6</div>
                    <div>
                        <div className={styles.reward_type}>Pending rewards</div>
                        <div className={styles.usd_amount}>Total value: $99.41</div>
                    </div>
                </div>
                <button className={`${styles.btn} ${styles.pending_btn}`}>View rewards</button>
            </div>
        </div>
    )
}

export default Rewards