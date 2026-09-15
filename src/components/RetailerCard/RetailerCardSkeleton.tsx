import styles from './styles.module.css'

const RetailerCardSkeleton = () => {
    return (
        <div className={styles.skeleton_card}>
            <div className={`${styles.skeleton_logo} skeleton_shimmer`} />
            <div className={styles.skeleton_text}>
                <div className={`${styles.skeleton_retailer_name} skeleton_shimmer`} />
                <div className={`${styles.skeleton_cashback_rate} skeleton_shimmer`} />
            </div>
        </div>
    )
}

export default RetailerCardSkeleton