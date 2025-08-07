import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import Markdown from 'react-markdown'
import { ComponentProps, useState } from 'react'
import { useTranslation } from 'react-i18next'
import message from '../../../utils/message'
import { useGoogleAnalytics } from '../../../utils/hooks/useGoogleAnalytics'
import { useRouteLoaderData } from 'react-router-dom'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    backgroundColor: string | undefined,
    iconPath: string
    name: string
    cashback: string
    terms: string
    generalTerms: string
    redirectLink: string
    iframeUrl?: string
    token?: string
    domain?: string
}

const RetailerCardModal = ({
    open,
    closeFn,
    backgroundColor,
    iconPath,
    name,
    cashback,
    terms,
    generalTerms,
    redirectLink,
    iframeUrl,
    token,
    domain
}: Props) => {

    const { sendGaEvent } = useGoogleAnalytics()
    const { extensionId } = useRouteLoaderData('root') as LoaderData
    const [fallbackImg, setFallbackImg] = useState('')
    const { t } = useTranslation()

    const onClose = () => {
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

    const activate = () => {
        window.postMessage({
            from: 'bringweb3',
            action: 'PORTAL_ACTIVATE',
            extensionId,
            time: 30 * 60 * 1000, // 30 minutes
            domain,
            iframeUrl,
            token
        })
        onClose()
        sendGaEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name,
        })
    }

    return (
        <Modal
            open={open}
            closeFn={onClose}
        >
            <div className={styles.modal}>
                <div className={styles.full}>
                    <div
                        className={styles.logo_container}
                        style={{ backgroundColor: backgroundColor || 'white' }}
                    >
                        {fallbackImg ?
                            <div className={styles.fallback_img}>{fallbackImg}</div>
                            :
                            <img
                                className={styles.logo}
                                loading='eager'
                                src={iconPath}
                                alt={`${name} logo`}
                                onError={() => setFallbackImg(name)}
                            />
                        }
                    </div>
                    <div className={styles.details}>
                        <div className={styles.retailer_name}>Shop at {name}</div>
                        <div className={styles.cashback_rate}>
                            Up to {cashback} cashback
                        </div>
                    </div>
                </div>
                {terms ?
                    <Markdown className={styles.markdown}>
                        {`${terms}${generalTerms}`}
                    </Markdown>
                    :
                    <div className={`${styles.markdown} ${styles.center}`}>
                        Loading...
                    </div>
                }
                {redirectLink && terms ?
                    <a
                        className={styles.start_btn}
                        onClick={activate}
                        href={redirectLink}
                        target='_blank'
                    >
                        {t('startShopping')}
                    </a>
                    :
                    <button
                        className={styles.start_btn}
                        disabled={true}
                    >
                        {t('loadingBtn')}
                    </button>
                }
                <div className={styles.consent_txt}>
                    By clicking Start Shopping, I accept the terms above.
                </div>
            </div>
        </Modal>
    )
}

export default RetailerCardModal