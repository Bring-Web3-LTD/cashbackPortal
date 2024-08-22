import styles from './styles.module.css'

const Header = () => {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>Crypto Cashback</h1>
            <h2 className={styles.subtitle}>Receive ADA tokens when shopping online!</h2>
            <button className={styles.btn}>How it works</button>
        </div>
    )
}

export default Header