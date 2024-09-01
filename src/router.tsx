import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import Home from './pages/Home/Home';
import History from './pages/History/History';
import fetchToken from './api/fetchToken';

const rootLoader = async () => {
    const params = new URLSearchParams(document.location.search)
    const token = params.get('token') || ''
    const res = await fetchToken({ token });
    console.log(res);

    return {
        walletAddress: '011e8784d9b47de988206dce537b0cc210671cc5ac3483bb887769c13fba257f40c080f1509fceeefad6871d16f765496bf22d188f6c9af303',
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
        errorElement: <div>Error</div>,
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