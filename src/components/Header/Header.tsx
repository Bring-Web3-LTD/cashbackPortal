import styles from './styles.module.css'
import ExplainModal from '../Modals/ExplainModal/ExplainModal'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const Header = () => {
    const [isOpen, setIsOpen] = useState(false)
    const { t } = useTranslation()
    return (
        <div className={styles.header}>
            {
                t('title') ?
                    <h1 className={styles.title}>{t('title')}</h1>
                    : null
            }
            {
                t('subtitle') ?
                    <h2 className={styles.subtitle}>{t('subtitle')}</h2>
                    : null
            }
            <button
                className={styles.btn}
                onClick={() => setIsOpen(true)}
            >{t('howItWorks')}</button>
            <ExplainModal
                open={isOpen}
                closeFn={() => setIsOpen(false)}
            />
        </div>
    )
}

export default Header