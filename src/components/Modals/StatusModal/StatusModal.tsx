import styles from './styles.module.css'
import { ComponentProps } from 'react'
import Modal from '../../Modal/Modal'
import message from '../../../utils/message'
import { useTranslation } from 'react-i18next'
import Icon from '../../Icon/Icon'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    status: 'success' | "failure" | 'loading'
}

interface StatusProps { closeFn: () => void }

const Loading = () => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <span className={styles.loader} role="status" aria-label="oval-loading" />
            <div className={`${styles.title} ${styles.title_loading}`}>
                Processing
            </div>
            <div className={styles.msg}>
                We are processing your request<br />it could take a few seconds.
            </div>
            <button
                id="status-modal-loading-btn"
                disabled
                className={styles.btn}
            >{t('doneBtn')}</button>
        </div>
    )
}

const Success = ({ closeFn }: StatusProps) => {
    const { t } = useTranslation()
    return (
        <div className={styles.card}>
            <Icon name="success.svg" alt="icon" />
            <div className={`${styles.title} ${styles.title_success}`}>
                Success
            </div>
            <div className={styles.msg}>
                The rewards have been successfully<br />deposited into your wallet.
            </div>
            <button
                id="status-modal-success-btn"
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('doneBtn')}</button>
        </div>
    )
}


const Failure = ({ closeFn }: StatusProps) => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <Icon name="error.svg" alt="icon" />
            <div className={`${styles.title} ${styles.title_error}`}>
                Error
            </div>
            <div className={styles.msg}>
                Something went wrong.<br />Please try again later.
            </div>
            <button
                id="status-modal-failure-btn"
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('doneBtn')}</button>
        </div>
    )
}

const StatusModal = ({ open, closeFn, status }: Props) => {
    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            {status === 'loading' ?
                <Loading />
                : status === 'failure' ?
                    <Failure closeFn={() => {
                        message({ action: 'POPUP_CLOSED' })
                        closeFn()
                    }} />
                    : status === 'success' ?
                        <Success closeFn={() => {
                            message({ action: 'POPUP_CLOSED' })
                            closeFn()
                        }} />
                        : null
            }
        </Modal>
    )
}

export default StatusModal