import styles from './styles.module.css'
import Popup from '../Popup/Popup'
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
            <Popup
                open={isOpen}
                closeFn={() => setIsOpen(false)}
            >
                <div style={{ color: 'white', maxWidth: '400px', marginTop: '30px', padding: '0 40px' }}>
                    <h2>How it works</h2>
                    <p>
                        Search for your favorite items and brands, browse through
                        various categories, or explore our top brands to find exactly
                        what you need.
                    </p>
                    <p>
                        Once you've made your selection, complete your purchase using
                        your preferred fiat payment method, such as a credit card,
                        PayPal, Apple Pay, Google Pay, or other digital wallets.
                    </p>
                    <p>
                        Within 48 hours, your crypto cashback will appear in the
                        "pending rewards" area.
                    </p>
                    <p>
                        After the specified lock period ends, simply check your pending
                        cashback and claim your crypto rewards with a few clicks. The
                        cashback will then be instantly transferred to your Aurora
                        wallet.
                    </p>
                    <p>
                        Enjoy up to 20% in crypto cashback on every purchase, making
                        your shopping experience not only enjoyable but also
                        highly rewarding.
                    </p>
                </div>
            </Popup>
        </div>
    )
}

export default Header