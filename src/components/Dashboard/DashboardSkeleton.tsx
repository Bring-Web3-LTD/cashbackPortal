import styles from './styles.module.css'

/**
 * Stands in for the summary row while the balance loads. Two cards only — the
 * design hides the tab switcher and the history card here, since neither can be
 * sized until the flags and the balance arrive.
 */
const DashboardSkeleton = () => (
    <div className={styles.skeleton_row} aria-hidden="true">
        {[0, 1].map(i => (
            <div key={i} className={styles.skeleton_card}>
                <span className={`${styles.skeleton_bar} ${styles.skeleton_bar_label} skeleton_shimmer`} />
                <span className={`${styles.skeleton_bar} ${styles.skeleton_bar_amount} skeleton_shimmer`} />
            </div>
        ))}
    </div>
)

export default DashboardSkeleton
