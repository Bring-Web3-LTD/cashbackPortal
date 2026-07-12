import { useLocation, useRouteLoaderData } from 'react-router-dom';
import { AnalyticsProvider } from '../context/AnalyticsContext';
import { MAINTENANCE_MODE } from '../config';
import '../utils/i18n'
import { WalletProvider } from '../context/WalletAddressContext';
import Maintenance from '../pages/Maintenance/Maintenance';
import DesktopOutlet from './DesktopOutlet';
import MobileOutlet from './MobileOutlet';

/**
 * Root layout. Hosts the shared providers (Wallet, Analytics) once for both
 * platforms; only the route outlet is split — DesktopOutlet vs MobileOutlet.
 */
const Layout = () => {
    const location = useLocation();
    const data = useRouteLoaderData('root') as LoaderData;

    const { platform } = data;

    if (MAINTENANCE_MODE) {
        return (
            <Maintenance />
        );

    }

    return (
        <WalletProvider
            initialWalletAddress={data.walletAddress}
            initIsTester={data.isTester}
            initialWalletName={data.walletName}
            initialWalletEmoji={data.walletEmoji}
            mode={data.useMobilePortal ? 'mobile' : 'desktop'}
        >
            <AnalyticsProvider
                platform={platform}
                location={location.pathname}
                flowId={data.flowId}
                userId={data.userId}
            >
                {data.useMobilePortal
                    ? <MobileOutlet pathname={location.pathname} />
                    : <DesktopOutlet pathname={location.pathname} />}
            </AnalyticsProvider>
        </WalletProvider>
    );
};

export default Layout;