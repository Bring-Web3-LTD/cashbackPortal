import { motion } from 'framer-motion'
import { useLocation, useRouteLoaderData } from 'react-router-dom';
import { GoogleAnalyticsProvider } from '../context/GoogleAnalyticsContext';
import { Outlet } from 'react-router-dom';
import { GA_MEASUREMENT_ID } from '../config';
import '../utils/i18n'

const Layout = () => {
    const location = useLocation();
    const { platform, walletAddress } = useRouteLoaderData('root') as LoaderData;

    return (
        <GoogleAnalyticsProvider measurementId={GA_MEASUREMENT_ID} platform={platform} walletAddress={walletAddress}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <div style={{ width: 'calc(100vw - 1px)', background: 'orange', color: 'white', textAlign: 'center', padding: '10px 0', fontSize: '14px', fontWeight: 600 }}>
                    You are using a demo wallet
                </div>
                <Outlet />
            </motion.div>
        </GoogleAnalyticsProvider>
    );
};

export default Layout;