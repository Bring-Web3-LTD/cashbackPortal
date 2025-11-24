import styles from './styles.module.css'
import { ComponentProps } from 'react'
import Modal from '../../Modal/Modal'
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../../utils/message'
import { useTranslation } from 'react-i18next'
import { Oval } from 'react-loader-spinner'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    status: 'success' | "failure" | 'loading'
}

interface StatusProps { closeFn: () => void }

const Loading = () => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <Oval
                height={40}
                width={40}
                color="#4B6DDE"
                secondaryColor="#4B6DDE50"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                ariaLabel='oval-loading'
            />
            <div className={styles.title}>
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
                id="status-modal-success-btn"
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