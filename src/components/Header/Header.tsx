import styles from './styles.module.css'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

const Header = () => {
    const { t } = useTranslation()
    const [searchParams] = useSearchParams()

    return (
        <div className={styles.header}>
            {
                t('title') ?
                    <h1 className={styles.title}>{t('title')}</h1>
                    : null
            }
            {
                t('subtitle') ?
                    <h2 className={styles.subtitle}>Shop online with any card. Get cashback in Crypto.</h2>
                    : null
            }
            <Link
                to={`/faq${searchParams.toString() ? '?' + searchParams.toString() : ''}`}
                className={styles.btn}
            >
                {t('frequentlyAskedQuestion')}
            </Link>
        </div>
    )
}

export default Header