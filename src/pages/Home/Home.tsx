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
                <Search
                    options={[{ label: 'adidas', value: 'adidas' }]}
                    value={search}
                    onChangeFn={(s) => console.log(s)}
                />
                <CardsList />
            </main>
        </div>
    )
}

export default Home