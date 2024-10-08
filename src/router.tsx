import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import Home from './pages/Home/Home';
import History from './pages/History/History';
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';
import fetchToken from './api/fetchToken';

const dev = {
    walletAddress: '011a9ba84fdd64a517c313a1cf353cafdb1eea77411639a9c23218dfb9ba257f40c080f1509fceeefad6871d16f765496bf22d188f6c9af303',
    platform: 'yoroi',
    cryptoSymbols: ['ADA', 'ETH', 'USDT', 'USDC', 'BTC'],
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
    const token = params.get('token')
    const theme = params.get('theme')?.toLowerCase() || 'dark'
    if (import.meta.env.VITE_ENV === 'development') {
        loadStylesheet(theme, dev.platform.toUpperCase())
        i18n.setDefaultNamespace(dev.platform.toUpperCase())
        return {
            ...dev,
            iconsPath: `${dev.platform.toUpperCase()}/icons/${theme}`,
        }
    }
    if (!token) throw Error('There was an error while loading the page')
    const res = await fetchToken({ token });
    if (!res || res.status !== 200 || !res.info || !Object.keys(res.info).length) throw Error('There was an error while loading the page')
    const platform = res.info.platform?.toUpperCase() || 'DEFAULT'
    loadStylesheet(theme, platform)
    i18n.setDefaultNamespace(platform)

    return {
        ...res.info,
        iconsPath: `${platform}/icons/${theme}`,
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