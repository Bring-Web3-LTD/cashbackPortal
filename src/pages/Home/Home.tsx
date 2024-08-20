import styles from './styles.module.css'

const Home = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Crypto Cashback</h1>
                <h2>Receive ADA tokens when shopping online!</h2>
                <div>Rewards</div>
            </div>
            <main>
                <div>Content</div>
            </main>
        </div>
    )
}

export default Home