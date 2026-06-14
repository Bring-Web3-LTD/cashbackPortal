import styles from './styles.module.css'

const RetailerCardSkeleton = () => {
    return (
        <div className={styles.card}>
            <div className={styles.skeleton_logo} />
            <div className={styles.skeleton_text}>
                <div className={styles.skeleton_retailer_name} />
                <div className={styles.skeleton_cashback_rate} />
            </div>
        </div>
    )
}

export default RetailerCardSkeleton