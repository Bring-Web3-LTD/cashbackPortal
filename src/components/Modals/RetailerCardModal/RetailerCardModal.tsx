import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import Markdown from 'react-markdown'
import { ComponentProps, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    backgroundColor: string | undefined,
    iconPath: string
    name: string
    cashback: string
    terms: string
    generalTerms: string
    redirectLink: string
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
    redirectLink
}: Props) => {

    const [fallbackImg, setFallbackImg] = useState('')
    const { t } = useTranslation()

    return (
        <Modal
            open={open}
            closeFn={closeFn}
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
                        onClick={closeFn}
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