import styles from './styles.module.css'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../utils/message'
import ExplainModal from '../Modals/ExplainModal/ExplainModal'
import Rewards from '../Rewards/Rewards'
import { useBalance, selectFirstTimeUser } from '../../hooks/useBalance'
import { ENV } from '../../config'

export type PortalView = 'coupons' | 'cashback'

interface Props {
    view: PortalView
    onViewChange: (view: PortalView) => void
}

const Dashboard = ({ view, onViewChange }: Props) => {
    const { t } = useTranslation()
    const { isHub, couponsEnabled, firstTimeUser: firstTimeOverride } = useRouteLoaderData('root') as LoaderData

    // Optimistically onboarding until /cache says the user already has
    // activity. Re-derived from the live query, so earning a first reward
    // leaves the onboarding state without waiting for a reload.
    const { data: balance } = useBalance()
    const firstTimeUser = firstTimeOverride ?? selectFirstTimeUser(balance)

    // Only the portal calls /cache, so report the resolved flag back to the
    // dev wrapper for its Dashboard flags panel. Dev only — the embedding host
    // in production has no use for it.
    // What /cache says, or the true default when it has not answered — which
    // includes after a disconnect, since the query is keyed on the address and
    // its data goes with it.
    const backendFirstTimeUser = selectFirstTimeUser(balance)
    useEffect(() => {
        if (ENV === 'prod') return
        message({
            action: 'PORTAL_FLAGS',
            isHub: Boolean(isHub),
            couponsEnabled: Boolean(couponsEnabled),
            firstTimeUser: backendFirstTimeUser,
        })
    }, [isHub, couponsEnabled, backendFirstTimeUser])
    const [explainOpen, setExplainOpen] = useState(false)

    const pairWallet = () => message({ action: 'LOGIN' })

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
        <div className={styles.bar}>
            {couponsEnabled && (
                <div className={styles.switcher}>
                    <div className={styles.tabs}>
                        {renderTab('coupons', t('couponsTab'))}
                        {renderTab('cashback', t('cashbackTab'))}
                    </div>
                </div>
            )}
            {firstTimeUser ? <div className={styles.banner}>
                <div className={styles.banner_content}>
                    <div className={styles.banner_title}>{t('welcomeTitle')}</div>
                    <div className={styles.banner_text}>{t('welcomeText')}</div>
                </div>
                <div className={styles.actions}>
                    {/* Wallet apps already hold an address; only the hub pairs one. */}
                    {!isHub && (
                        <button
                            id="dashboard-pair-wallet-btn"
                            className={`${styles.action} ${styles.action_primary}`}
                            onClick={pairWallet}
                        >
                            {t('pairWallet')}
                        </button>
                    )}
                    <button
                        id="dashboard-whats-this-btn"
                        className={`${styles.action} ${styles.action_secondary}`}
                        onClick={() => setExplainOpen(true)}
                    >
                        {t('whatsThis')}
                    </button>
                </div>
            </div> : <Rewards />}
            <ExplainModal open={explainOpen} closeFn={() => setExplainOpen(false)} />
        </div>
    )
}

export default Dashboard
