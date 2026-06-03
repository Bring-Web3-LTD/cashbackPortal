/**
 * Per-route dispatchers — pick the mobile or desktop page based on the
 * `useMobilePortal` loader flag. Keeps the existing desktop pages
 * untouched and isolates the mobile portal entirely under `src/mobile/`.
 */
import { useRouteLoaderData } from 'react-router-dom'
import Home from './pages/Home/Home'
import History from './pages/History'
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import MobileHome from './mobile/pages/MobileHome'
import MobileHistory from './mobile/pages/MobileHistory'
import MobileFaq from './mobile/pages/MobileFaq'

export const HomeDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobileHome /> : <Home />
}

export const HistoryDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobileHistory /> : <History />
}

export const FaqDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobileFaq /> : <FrequentlyAskedQuestion />
}
