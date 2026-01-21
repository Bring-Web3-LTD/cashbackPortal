import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import { ComponentProps } from 'react'
import message from '../../../utils/message'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    backgroundColor?: string | undefined,
}

const LoginModal = ({
    open,
    closeFn
}: Props) => {

    const { t } = useTranslation()
    const { iconsPath } = useRouteLoaderData('root') as LoaderData

    const onClose = () => {
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

    const promptLogin = () => {
        message({ action: 'LOGIN' })
        closeFn()
    }

    return (
        <Modal
            open={open}
            closeFn={onClose}
        >
            <div className={styles.modal}>
                <img src={`${iconsPath}/wallet.svg`} alt="wallet icon" />
                <div className={styles.title}>{t('connectYourWallet')}</div>
                <div className={styles.subtitle}>Please login to your wallet to proceed</div>
                <button className={styles.btn} onClick={promptLogin}>CONNECT</button>
            </div>
        </Modal>
    )
}

export default LoginModal