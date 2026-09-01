/**
 * Per-route dispatchers — pick the mobile or desktop page based on the
 * `useMobilePortal` loader flag. Mobile pages are the `.mobile` views
 * colocated with their desktop counterparts under `src/pages/`.
 */
import { Navigate, useRouteLoaderData } from 'react-router-dom'
import Home from './pages/Home/Home'
import History from './pages/History'
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import MobileHome from './pages/Home/Home.mobile'
import MobileHistory from './pages/History/History.mobile'
import MobilePending from './pages/Pending/Pending.mobile'
import MobileFaq from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion.mobile'
import MobileWhatsThis from './pages/WhatsThis/WhatsThis.mobile'

export const HomeDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobileHome /> : <Home />
}

export const HistoryDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobileHistory /> : <History />
}

/** Mobile-only screen — desktop has no pending view, so it goes back home. */
export const PendingDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobilePending /> : <Navigate to="/" replace />
}

export const FaqDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobileFaq /> : <FrequentlyAskedQuestion />
}

/** Mobile-only screen — desktop has no "What's This?" view, so it goes back home. */
export const WhatsThisDispatcher = () => {
    const { useMobilePortal } = useRouteLoaderData('root') as LoaderData
    return useMobilePortal ? <MobileWhatsThis /> : <Navigate to="/" replace />
}
