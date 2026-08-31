import styles from './styles.module.css'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'

/** Persistent legal bar; the feed is endless so a flow footer is unreachable. */
const LegalBar = () => {
    const { t } = useTranslation()
    const { bringTou, privacy } = useRouteLoaderData('root') as LoaderData

    if (!privacy && !bringTou) return null

    return (
        <div className={styles.dock}>
        <footer className={styles.bar}>
            {privacy ?
                <a
                    id="legal-privacy-link"
                    href={privacy}
                    target='_blank'
                    rel='noreferrer'
                    className={styles.link}
                >
                    {t('privacy', 'Privacy')}
                </a>
                : null}
            {bringTou ?
                <a
                    id="legal-terms-link"
                    href={bringTou}
                    target='_blank'
                    rel='noreferrer'
                    className={styles.link}
                >
                    {t('termsOfUse', 'Terms of Use')}
                </a>
                : null}
            </footer>
        </div>
    )
}

export default LegalBar
