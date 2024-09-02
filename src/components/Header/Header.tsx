import styles from './styles.module.css'
import ExplainModal from '../Modals/ExplainModal/ExplainModal'
import { useState } from 'react'

const Header = () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>Crypto Cashback</h1>
            <h2 className={styles.subtitle}>Receive ADA tokens when shopping online!</h2>
            <button
                className={styles.btn}
                onClick={() => setIsOpen(true)}
            >How it works</button>
            <ExplainModal
                open={isOpen}
                closeFn={() => setIsOpen(false)}
            />
        </div>
    )
}

export default Header