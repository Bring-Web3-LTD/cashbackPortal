/*
 * Pending purchases — bottom-sheet overlay opened from the dashboard's Pending
 * tile. Same shell as History: the previous page renders behind a darkening
 * layer. Pure UI — logic in usePendingPage.
 */
import MobileHeader from '../../components/Header/Header.mobile'
import MobileHistoryItem from '../../components/HistoryItem/HistoryItem.mobile'
import MobileHome from '../Home/Home.mobile'
import { usePendingPage } from './usePendingPage'
import styles from './styles.mobile.module.css'

const MobilePending = () => {
    const { labels, rows, isLoading, openId, close, onToggle } = usePendingPage()

    return (
        <div className={styles.root} data-testid="mobile-pending">
            <div className={styles.behind} aria-hidden="true">
                <MobileHome />
            </div>

            <div className={styles.darken} aria-hidden="true" onClick={close} />

            <div className={styles.sheet} role="dialog" aria-modal="true">
                <MobileHeader title={labels.title} onClose={close} />
                <main className={styles.content}>
                    {isLoading ? null : rows.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyText}>{labels.empty}</p>
                        </div>
                    ) : (
                        <>
                            <p className={styles.intro}>{labels.rewardHistory}</p>
                            <div className={styles.list}>
                                {rows.map((row) => (
                                    <MobileHistoryItem
                                        key={row.id}
                                        row={row}
                                        isOpen={openId === row.id}
                                        onToggle={() => onToggle(row.id)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default MobilePending
