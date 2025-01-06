import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import Home from './pages/Home/Home';
import History from './pages/History';
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';

const dev = {
    walletAddress: 'addr1qydfh2z0m4j2297rzwsu7dfu4ld3a6nhgytrn2wzxgvdlwd6y4l5psyq79gflnhwlttgw8gk7aj5j6lj95vg7my67vpsdcvu4l',
    platform: 'yoroi',
    cryptoSymbols: ['ADA'],
    isCountryAvailable: true,
}

const loadStylesheet = (theme: string, platform: string) => {
    // Dynamically load the main CSS file
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';

    cssLink.href = `./${platform}/stylesheets/${theme}.css`; // Specify the path to your main CSS file
    document.head.appendChild(cssLink);
}

const rootLoader = async () => {
    const params = new URLSearchParams(document.location.search)
    const walletAddress = params.get('address')
    const theme = params.get('theme')?.toLowerCase() || 'light'
    loadStylesheet(theme, 'DEFAULT')
    i18n.setDefaultNamespace('DEFAULT')
    return {
        ...dev,
        walletAddress: walletAddress || dev.walletAddress,
        iconsPath: `${dev.platform.toUpperCase()}/icons/${theme}`,
    }
}

const router = createBrowserRouter([
    {
        id: "root",
        path: "/",
        element: <Layout />,
        errorElement: <ErrorMessage />,
        loader: rootLoader,
        shouldRevalidate: () => false,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'history',
                element: <History />,
            },
            {
                path: 'faq',
                element: <FrequentlyAskedQuestion />,
            },
        ],
    },
]);

export default router;