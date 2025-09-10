import styles from './styles.module.css'
import { ComponentProps } from "react"
import Modal from "../../Modal/Modal"
import { useRouteLoaderData } from "react-router-dom"
import { useTranslation } from 'react-i18next'

const CampaignEndModal = ({ open, closeFn }: Omit<ComponentProps<typeof Modal>, 'children'>) => {
    const { iconsPath } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()

    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            <div className={styles.modal}>
                <img src={`${iconsPath}/download.svg`} alt="wallet icon" />
                <div className={styles.title}>Better luck next time!</div>
                <div className={styles.subtitle}>The deal is sold out or isn't available in your country.<br />Install Ready Wallet now to catch the next one.</div>
                <a
                    className={styles.btn}
                    href={`${t('chromeStoreLink')}`}
                    target='_blank'
                >Install Wallet</a>
            </div>
        </Modal>
    )
}

export default CampaignEndModal