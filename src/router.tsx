import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import Home from './pages/Home/Home';
import History from './pages/History';
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';
import fetchToken from './api/fetchToken';
import { DEV_MODE, ENV } from './config';
import { v4 } from 'uuid';
import getUserId from './utils/getUserId';

const loadStylesheet = (theme: string, platform: string) => {
    // Dynamically load the main CSS file
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';

    cssLink.href = `/${platform}/stylesheets/${theme}.css`; // Specify the path to your main CSS file
    document.head.appendChild(cssLink);
}

const rootLoader = async () => {
    const params = new URLSearchParams(document.location.search)
    const token = params.get('token')
    const extensionId = params.get('extensionId')
    const showTerms = !(params.get('terms')?.toLowerCase() === 'false')
    console.log({ showTerms })
    const theme = params.get('theme')?.toLowerCase() || 'light'
    const flowId = v4()
    if (DEV_MODE) {
        const dev = {
            walletAddress: params.get('walletAddress') || null,
            platform: params.get('platform'),
            cryptoSymbols: params.get('cryptoSymbols')?.split(','),
            isCountryAvailable: true,
        }
        if (!dev.platform) throw Error('Missing platform')
        loadStylesheet(theme, dev.platform.toUpperCase())
        i18n.setDefaultNamespace(dev.platform.toUpperCase())
        return {
            ...dev,
            iconsPath: `/${dev.platform.toUpperCase()}/icons/${theme}`,
            userId: getUserId(dev.platform),
            isTester: false,
            flowId,
            showTerms,
            extensionId
        }
    }
    if (!token) throw Error('There was an error while loading the page')
    const res = await fetchToken({ token });
    if (!res || res.status !== 200 || !res.info || !Object.keys(res.info).length) throw Error('There was an error while loading the page')
    const platform = res.info.platform?.toUpperCase() || 'DEFAULT'

    loadStylesheet(theme, platform)
    i18n.setDefaultNamespace(platform)

    if (ENV === 'prod') {
        delete res.info.isTester
    } else {
        res.info.isTester = !!res.info.isTester
    }

    return {
        ...res.info,
        iconsPath: `/${platform}/icons/${theme}`,
        userId: getUserId(res.info.platform),
        extensionId,
        showTerms,
        flowId
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