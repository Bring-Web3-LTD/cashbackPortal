import styles from './styles.module.css'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const Header = () => {
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
            <Link
                to={'/faq'}
                className={styles.btn}
            >
                {t('frequentlyAskedQuestion')}
            </Link>
        </div>
    )
}

export default Header