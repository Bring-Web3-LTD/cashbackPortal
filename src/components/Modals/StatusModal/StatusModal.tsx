import styles from './styles.module.css'
import { ComponentProps } from 'react'
import Modal from '../../Modal/Modal'
import message from '../../../utils/message'
import { useTranslation } from 'react-i18next'
import Icon from '../../Icon/Icon'
import { shortenWalletAddress } from '../../../utils/claimFlow'

interface ClaimInfo {
    amount?: string
    address?: string | null
}

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'>, ClaimInfo {
    status: 'success' | "failure" | 'loading'
}

interface StatusProps { closeFn: () => void }

const Loading = ({ closeFn }: StatusProps) => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <span className={styles.loader} role="status" aria-label={t('statusProcessingTitle')} />
            <div className={`${styles.title} ${styles.title_loading}`}>
                {t('statusProcessingTitle')}
            </div>
            <div className={`${styles.msg} ${styles.msg_wide}`}>
                <div>{t('statusProcessingMsg')}</div>
                <div>{t('statusProcessingMsg2')}</div>
            </div>
            <button
                id="status-modal-loading-btn"
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('statusCloseBtn')}</button>
        </div>
    )
}

const STARS = ['a', 'b', 'c', 'd', 'e', 'f']

const Success = ({ closeFn, amount, address }: StatusProps & ClaimInfo) => {
    const { t } = useTranslation()
    return (
        <div className={styles.success_card}>
            <div className={styles.art}>
                <Icon className={styles.glow} name="success-glow.svg" alt="" />
                {amount ? <div className={styles.amount}>{amount}</div> : null}
                <div className={styles.stars}>
                    {STARS.map(s => (
                        <Icon key={s} className={styles[`star_${s}`]} name={`star-${s}.svg`} alt="" />
                    ))}
                </div>
            </div>
            <div className={styles.success_title}>
                {t('statusSuccessTitle')}
            </div>
            <div className={styles.success_msg}>
                {t('statusSuccessMsg', { address: shortenWalletAddress(address) })}
            </div>
            <button
                id="status-modal-success-btn"
                onClick={() => closeFn()}
                className={`${styles.btn} ${styles.success_btn}`}
            >{t('statusCloseBtn')}</button>
        </div>
    )
}


const Failure = ({ closeFn }: StatusProps) => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <Icon className={styles.icon} name="error.svg" alt="" />
            <div className={`${styles.title} ${styles.title_error}`}>
                {t('statusErrorTitle')}
            </div>
            <div className={styles.msg}>
                {t('statusErrorMsg')}
            </div>
            <button
                id="status-modal-failure-btn"
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('statusCloseBtn')}</button>
        </div>
    )
}

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-status-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-status-radius, var(--modal-radius))',
}

const StatusModal = ({ open, closeFn, status, amount, address }: Props) => {
    const close = () => {
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

    return (
        <Modal
            open={open}
            closeFn={closeFn}
            className={styles.overlay}
            contentClassName={styles.shell}
            closeBtnClassName={styles.close}
            style={shellOverrides}
        >
            {status === 'loading' ?
                <Loading closeFn={close} />
                : status === 'failure' ?
                    <Failure closeFn={close} />
                    : status === 'success' ?
                        <Success amount={amount} address={address} closeFn={close} />
                        : null
            }
        </Modal>
    )
}

export default StatusModal