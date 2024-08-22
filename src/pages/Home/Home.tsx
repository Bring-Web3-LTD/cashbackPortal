import styles from './styles.module.css'
import Header from '../../components/Header/Header'
import Rewards from '../../components/Rewards/Rewards'
import CardsList from '../../components/CardsList/CardsList'
import Search from '../../components/Search/Search'
import { useState } from 'react'

const Home = () => {
    const [search, setSearch] = useState({ label: 'adidas', value: 'adidas' })

    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
                <Rewards />
                <div className={styles.search_section}>
                    <Search
                        options={[{ label: 'adidas', value: 'adidas' }, { label: 'Daniel', value: 'Daniel' }]}
                        value={search}
                        onChangeFn={(item) => setSearch(item)}
                    />
                    <div className={styles.deals_amount}>Showing 528 deals</div>
                </div>
                <CardsList />
                <div className={styles.load}>Loading</div>
            </main>
        </div>
    )
}

export default Home