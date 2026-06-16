/**
 * Per-route dispatchers — pick the mobile or desktop page based on the
 * `useMobilePortal` loader flag. Mobile pages are the `.mobile` views
 * colocated with their desktop counterparts under `src/pages/`.
 */
import { useRouteLoaderData } from 'react-router-dom'
import Home from './pages/Home/Home'
import History from './pages/History'
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import MobileHome from './pages/Home/Home.mobile'
import MobileHistory from './pages/History/History.mobile'
import MobileFaq from './pages/Faq/Faq.mobile'

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
