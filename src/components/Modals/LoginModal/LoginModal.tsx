import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import { ComponentProps } from 'react'
import message from '../../../utils/message'
import { useTranslation } from 'react-i18next'
import Icon from '../../Icon/Icon'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    backgroundColor?: string | undefined,
    /** Fired only when the user hits "connect" — not when the modal is dismissed. */
    onConnect?: () => void,
}

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-popup-frame-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-popup-radius, var(--modal-radius))',
}

const LoginModal = ({
    open,
    closeFn,
    onConnect
}: Props) => {

    const { t } = useTranslation()

    const onClose = () => {
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

    const promptLogin = () => {
        message({ action: 'LOGIN' })
        onConnect?.()
        closeFn()
    }

    return (
        <Modal
            open={open}
            closeFn={onClose}
            className={styles.overlay}
            contentClassName={styles.shell}
            closeBtnClassName={styles.close}
            style={shellOverrides}
        >
            <div className={styles.header} />
            <div className={styles.content}>
                <div className={styles.icon_area}>
                    <div className={styles.icon}>
                        <Icon className={styles.icon_img} name="wallet.svg" alt="" />
                    </div>
                </div>
                <div className={styles.paragraph}>
                    <div className={styles.title}>{t('connectYourWallet')}</div>
                    <div className={styles.subtitle}>{t('connectWalletHint')}</div>
                </div>
            </div>
            <div className={styles.footer}>
                <button id="login-modal-btn" className={styles.btn} onClick={promptLogin}>{t('connect')}</button>
            </div>
        </Modal>
    )
}

export default LoginModal