/**
 * Dashboard bar: the coupons/cashback switcher, then either the onboarding
 * banner or the rewards cards. Pure UI — logic in useDashboard.
 */
import styles from './styles.module.css'
import ExplainModal from '../Modals/ExplainModal/ExplainModal'
import PairWalletModal from '../PairWalletModal/PairWalletModal'
import DashboardSkeleton from './DashboardSkeleton'
import Rewards from '../Rewards/Rewards'
import { useDashboard } from './useDashboard'

export type PortalView = 'coupons' | 'cashback'

interface Props {
    view: PortalView
    onViewChange: (view: PortalView) => void
}

const Dashboard = ({ view, onViewChange }: Props) => {
    const {
        showPairWallet,
        couponsEnabled,
        showSkeleton,
        firstTimeUser,
        explainOpen,
        openExplain,
        closeExplain,
        pairOpen,
        openPair,
        closePair,
        labels,
    } = useDashboard()

    const renderTab = (name: PortalView, label: string) => (
        <button
            id={`dashboard-tab-${name}`}
            className={`${styles.tab} ${view === name ? styles.tab_active : styles.tab_idle}`}
            onClick={() => onViewChange(name)}
        >
            {label}
        </button>
    )

    return (
        <div className={`${styles.bar} ${showSkeleton ? styles.bar_skeleton : ''}`}>
            {couponsEnabled && (
                <div className={styles.switcher}>
                    <div className={styles.tabs}>
                        {renderTab('coupons', labels.couponsTab)}
                        {renderTab('cashback', labels.cashbackTab)}
                    </div>
                </div>
            )}
            {showSkeleton ? <DashboardSkeleton /> : firstTimeUser ? <div className={styles.banner}>
                <div className={styles.banner_content}>
                    <div className={styles.banner_title}>{labels.welcomeTitle}</div>
                    <div className={styles.banner_text}>{labels.welcomeText}</div>
                </div>
                <div className={styles.actions}>
                    {showPairWallet && (
                        <button
                            id="dashboard-pair-wallet-btn"
                            className={`${styles.action} ${styles.action_primary}`}
                            onClick={openPair}
                        >
                            {labels.pairWallet}
                        </button>
                    )}
                    <button
                        id="dashboard-whats-this-btn"
                        className={`${styles.action} ${styles.action_secondary}`}
                        onClick={openExplain}
                    >
                        {labels.whatsThis}
                    </button>
                </div>
            </div> : <Rewards />}
            <ExplainModal open={explainOpen} closeFn={closeExplain} />
            {/* Both routes run against /v1/auth/pair inside the modal. */}
            <PairWalletModal open={pairOpen} closeFn={closePair} />
        </div>
    )
}

export default Dashboard
