/**
 * Persistent legal bar; the feed is endless so a flow footer is unreachable.
 * Pure UI — logic in useLegalBar.
 */
import styles from './styles.module.css'
import { useLegalBar } from './useLegalBar'

const LegalBar = () => {
    const { privacy, bringTou, visible, labels } = useLegalBar()

    if (!visible) return null

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
                    {labels.privacy}
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
                    {labels.termsOfUse}
                </a>
                : null}
            </footer>
        </div>
    )
}

export default LegalBar
