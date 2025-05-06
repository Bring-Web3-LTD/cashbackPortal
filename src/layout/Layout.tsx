import { motion } from 'framer-motion'
import { useLocation, useRouteLoaderData } from 'react-router-dom';
import { GoogleAnalyticsProvider } from '../context/GoogleAnalyticsContext';
import { Outlet } from 'react-router-dom';
import { GA_MEASUREMENT_ID } from '../config';
import '../utils/i18n'
import { WalletProvider } from '../context/WalletAddressContext';

const Layout = () => {
    const location = useLocation();
    const data = useRouteLoaderData('root') as LoaderData;

    const { platform } = data;
    return (
        <WalletProvider initialWalletAddress={data.walletAddress}>
            <GoogleAnalyticsProvider
                measurementId={GA_MEASUREMENT_ID}
                platform={platform}
                location={location.pathname}
                flowId={data.flowId}
                userId={data.userId}
            >
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Outlet />
                </motion.div>
            </GoogleAnalyticsProvider>
        </WalletProvider>
    );
};

export default Layout;