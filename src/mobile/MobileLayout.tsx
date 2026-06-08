/**
 * Mobile portal root layout. Rendered by `src/layout/Layout.tsx` when
 * `useMobilePortal` is true. Provides the same providers as the desktop
 * layout (Wallet, GA, framer-motion fade) but renders the mobile chrome
 * and mobile-specific <Outlet /> children.
 *
 * Real chrome (top bar, footer nav) is added in Step 6 alongside the
 * mobile Home page. For now this is just a thin shell so the routing
 * branch compiles and runs.
 */
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { GoogleAnalyticsProvider } from '../context/GoogleAnalyticsContext'
import { WalletProvider } from '../context/WalletAddressContext'
import { GA_MEASUREMENT_ID } from '../config'
import styles from './MobileLayout.module.css'

interface Props {
    data: LoaderData
}

const MobileLayout = ({ data }: Props) => {
    const location = useLocation()
    const { platform } = data

    return (
        <WalletProvider
            initialWalletAddress={data.walletAddress}
            initIsTester={data.isTester}
            initialWalletName={data.walletName}
            initialWalletEmoji={data.walletEmoji}
        >
            <GoogleAnalyticsProvider
                measurementId={GA_MEASUREMENT_ID}
                platform={platform}
                location={location.pathname}
                flowId={data.flowId}
                userId={data.userId}
            >
                <motion.div
                    key={location.pathname}
                    className={styles.root}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Outlet />
                </motion.div>
            </GoogleAnalyticsProvider>
        </WalletProvider>
    )
}

export default MobileLayout
