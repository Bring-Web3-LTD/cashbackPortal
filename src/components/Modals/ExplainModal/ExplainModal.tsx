import styles from './styles.module.css';
import Modal from "../../Modal/Modal";
import { ComponentProps } from "react";
import { useTranslation } from 'react-i18next';

const ExplainModal = ({ open, closeFn }: Omit<ComponentProps<typeof Modal>, 'children'>) => {
    const { t } = useTranslation()

    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            <div className={styles.modal_container}>
                <h2 className={styles.modal_title}>{t('howItWorks')}</h2>
                <p className={styles.p}>
                    Search for your favorite items and brands, browse through
                    various categories, or explore our top brands to find exactly
                    what you need.
                </p>
                <p className={styles.p}>
                    Once you've made your selection, complete your purchase using
                    your preferred fiat payment method, such as a credit card,
                    PayPal, Apple Pay, Google Pay, or other digital wallets.
                </p>
                <p className={styles.p}>
                    Within 48 hours, your crypto cashback will appear in the
                    "pending rewards" area.
                </p>
                <p className={styles.p}>
                    After the specified lock period ends, simply check your pending
                    cashback and claim your crypto rewards with a few clicks. The
                    cashback will then be instantly transferred to your Aurora
                    wallet.
                </p>
                <p className={styles.p}>
                    Enjoy up to 20% in crypto cashback on every purchase, making
                    your shopping experience not only enjoyable but also
                    highly rewarding.
                </p>
            </div>
        </Modal>
    )
}

export default ExplainModal