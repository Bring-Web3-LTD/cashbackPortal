/*
 * Mobile "What's This?" — bottom-sheet overlay explaining Coupons / Cashback /
 * Claim (Figma 278:3244). Pure UI — logic in useWhatsThis.
 */
import MobileHeader from '../../components/Header/Header.mobile'
import Icon from '../../components/Icon/Icon'
import MobileHome from '../Home/Home.mobile'
import { useWhatsThis } from './useWhatsThis'
import styles from './styles.mobile.module.css'

const MobileWhatsThis = () => {
    const { labels, cards, close, onDownloadWallet } = useWhatsThis()

    return (
        <div className={styles.root} data-testid="mobile-whats-this">
            <div className={styles.behind} aria-hidden="true">
                <MobileHome />
            </div>
            <div className={styles.darken} aria-hidden="true" onClick={close} />
            <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={labels.title}>
                <MobileHeader title={labels.title} onClose={close} />
                <main className={styles.content}>
                    <div className={styles.block}>
                        <p className={styles.intro}>{labels.intro}</p>
                        <div className={styles.cards}>
                            {cards.map((card) => (
                                <div key={card.icon} className={styles.card}>
                                    <span className={styles.cardIcon}>
                                        <Icon name={card.icon} className={styles.icon} />
                                    </span>
                                    <div className={styles.cardText}>
                                        <p className={styles.cardTitle}>{card.title}</p>
                                        <p className={styles.cardDescription}>{card.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="button" className={styles.cta} onClick={onDownloadWallet}>
                        {labels.downloadWallet}
                    </button>
                </main>
            </div>
        </div>
    )
}

export default MobileWhatsThis
