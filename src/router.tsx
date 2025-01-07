import { createBrowserRouter, LoaderFunctionArgs } from 'react-router-dom';
import Layout from './layout/Layout';
import Home from './pages/Home/Home';
import History from './pages/History';
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';
// import { DEV_MODE } from './config';

const dev = {
    platform: 'yoroi',
    cryptoSymbols: ['ADA'],
    isCountryAvailable: true,
}

const loadStylesheet = (theme: string, platform: string) => {
    // Dynamically load the main CSS file
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';

    cssLink.href = `/${platform}/stylesheets/${theme}.css`; // Specify the path to your main CSS file
    document.head.appendChild(cssLink);
}

const rootLoader = async ({ request }: LoaderFunctionArgs) => {
    const { searchParams: params } = new URL(request.url)
    const walletAddress = params.get('address')

    if (!walletAddress) {
        throw new Error('This link is broken, please contact Bring to get a working link, you can contact us here: 1websitecontact@gmail.com')
    }
    const theme = params.get('theme')?.toLowerCase() || 'light'
    loadStylesheet(theme, 'DEFAULT')
    i18n.setDefaultNamespace('DEFAULT')
    return {
        ...dev,
        walletAddress,
        iconsPath: `/${dev.platform.toUpperCase()}/icons/${theme}`,
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
]
);

export default router;