import styles from './styles.module.css'

const Rewards = () => {


    return (
        <div className={styles.container}>
            <div className={styles.reward_details}>
                <img src="/icons/gift.svg" alt="gift icon" />
                <div className={`${styles.amount} ${styles.amount_claim}`}>153.4</div>
                <div>
                    <div className={styles.reward_type}>Ready to claim</div>
                    <div className={styles.usd_amount}>Total value: $45.55</div>
                </div>
            </div>
            <div className={styles.reward_details}>
                <img src="/icons/clock.svg" alt="clock icon" />
                <div className={`${styles.amount} ${styles.amount_pending}`}>438.2</div>
                <div>
                    <div className={styles.reward_type}>Pending rewards</div>
                    <div className={styles.usd_amount}>Total value: $99.41</div>
                </div>
            </div>
            <button className={styles.btn}>View Rewards</button>
        </div>
    )
}

export default Rewards