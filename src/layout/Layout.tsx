import { useLocation, useRouteLoaderData } from 'react-router-dom';
import { AnalyticsProvider } from '../context/AnalyticsContext';
import { MAINTENANCE_MODE, STANDALONE } from '../config';
import '../utils/i18n'
import { useSignedIn } from '../api/request';
import { WalletProvider } from '../context/WalletAddressContext';
import { ClaimProvider } from '../context/ClaimContext';
import Maintenance from '../pages/Maintenance/Maintenance';
import Register from '../pages/Register/Register';
import DesktopOutlet from './DesktopOutlet';
import MobileOutlet from './MobileOutlet';
import LegalBar from '../components/LegalBar/LegalBar';
import BackToTop from '../components/BackToTop/BackToTop';
import styles from './Layout.module.css';

/**
 * Root layout. Hosts the shared providers (Wallet, Analytics) once for both
 * platforms; only the route outlet is split — DesktopOutlet vs MobileOutlet.
 */
const Layout = () => {
    const location = useLocation();
    const data = useRouteLoaderData('root') as LoaderData;

    const { platform } = data;
    const signedIn = useSignedIn();

    if (MAINTENANCE_MODE) {
        return (
            <Maintenance />
        );

    }

    // No identity, no portal: standalone users sign in by email, and the token
    // says whether a verified session issued it. A session that dies later (the
    // refresh answered 401) brings the same screen back.
    if (STANDALONE && (data.loginType !== 'email' || signedIn === false)) {
        return <Register />;
    }

    return (
        <WalletProvider
            initialWalletAddress={data.walletAddress}
            initIsTester={data.isTester}
            initialWalletName={data.walletName}
            initialWalletEmoji={data.walletEmoji}
            initialCouponsIframeSrc={data.couponsIframeSrc ?? undefined}
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
                    /* Desktop only: the mobile tree runs its own claim flow. */
                    : <ClaimProvider>
                        <div className={styles.screen}>
                            <DesktopOutlet pathname={location.pathname} />
                            <LegalBar />
                            <BackToTop />
                        </div>
                    </ClaimProvider>}
            </AnalyticsProvider>
        </WalletProvider>
    );
};

export default Layout;