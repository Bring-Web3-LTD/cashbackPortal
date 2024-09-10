import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import Home from './pages/Home/Home';
import History from './pages/History/History';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';
import fetchToken from './api/fetchToken';

const rootLoader = async () => {
    // const params = new URLSearchParams(document.location.search)
    // const token = params.get('token')
    // if (!token) throw Error('There was an error while loading the page')
    // const res = await fetchToken({ token });
    // if (!res || res.status !== 200 || !res.info || !Object.keys(res.info).length) throw Error('There was an error while loading the page')
    // i18n.setDefaultNamespace(res.info.platform.toUpperCase() || 'default')
    // return res.info
    return {
        walletAddress: '011a9ba84fdd64a517c313a1cf353cafdb1eea77411639a9c23218dfb9ba257f40c080f1509fceeefad6871d16f765496bf22d188f6c9af303',
        platform: 'yoroi',
        cryptoSymbols: ['ADA', 'ETH', 'USDT', 'USDC', 'BTC'],
        isCountryAvailable: true,
    }
}

const router = createBrowserRouter([
    {
        id: "root",
        path: "/",
        element: <Layout />,
        errorElement: <ErrorMessage />,
        loader: rootLoader,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'history',
                element: <History />,
            },
        ],
    },
]);

export default router;