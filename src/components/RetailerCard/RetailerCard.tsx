import styles from './styles.module.css'

const RetailerCard = () => {
    return (
        <div className={styles.card}>
            <div className={styles.flag}>5.5%</div>
            <div className={styles.logo_container}>
                <img className={styles.logo} src="/images/retailer-logo.png" alt="retailer logo" />
            </div>
            <div className={styles.retailer_name}>Dell</div>
            <div className={styles.cashback_rate}>Up to 5.5% cashback</div>
        </div>
    )
}

export default RetailerCard