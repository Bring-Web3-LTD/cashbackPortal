import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home/Home";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />,
        errorElement: <div>Error</div>,
        loader: () => ({
            walletAddress: '011e8784d9b47de988206dce537b0cc210671cc5ac3483bb887769c13fba257f40c080f1509fceeefad6871d16f765496bf22d188f6c9af303',
            platform: 'yoroi',
            cryptoSymbols: ['ADA', 'ETH', 'USDT', 'USDC', 'BTC'],
            isCountryAvailable: true,
        }),
    }
])

export default router