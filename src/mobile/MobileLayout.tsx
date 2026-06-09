/**
 * Mobile portal root layout. Rendered by `src/layout/Layout.tsx` when
 * `useMobilePortal` is true. Provides the same providers as the desktop
 * layout (Wallet, GA, framer-motion fade) and renders the mobile-specific
 * <Outlet /> children. Per-page chrome (header/back) lives in the pages.
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
            mode="mobile"
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
