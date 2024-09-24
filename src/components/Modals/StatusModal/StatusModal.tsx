import styles from './styles.module.css'
import { ComponentProps } from 'react'
import Modal from '../../Modal/Modal'
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../../utils/message'
import { useTranslation } from 'react-i18next'


interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    status: 'success' | "failure"
}

interface StatusProps { closeFn: () => void }

const Success = ({ closeFn }: StatusProps) => {
    const { iconsPath } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()
    return (
        <div className={styles.card}>
            <img src={`${iconsPath}/success.svg`} alt="icon" />
            <div className={`${styles.title} ${styles.title_success}`}>
                Success
            </div>
            <div className={styles.msg}>
                The rewards have been successfully<br />deposited into your wallet.
            </div>
            <button
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('doneBtn')}</button>
        </div>
    )
}


const Failure = ({ closeFn }: StatusProps) => {
    const { iconsPath } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <img src={`${iconsPath}/error.svg`} alt="icon" />
            <div className={`${styles.title} ${styles.title_error}`}>
                Error
            </div>
            <div className={styles.msg}>
                Something went wrong.<br />Please try again later.
            </div>
            <button
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
            {status === 'failure' ?
                <Failure closeFn={() => {
                    closeFn()
                    message({ action: 'CLOSE_POPUP' })
                }} />
                : status === 'success' ?
                    <Success closeFn={() => {
                        closeFn()
                        message({ action: 'CLOSE_POPUP' })
                    }} />
                    : null
            }
        </Modal>
    )
}

export default StatusModal