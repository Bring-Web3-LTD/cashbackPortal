// The home tab lives on the URL, so in-app navigation carries it back home.
import { useRouteLoaderData, useSearchParams } from 'react-router-dom'
import type { PortalView } from '../components/Dashboard/Dashboard'

const PARAM = 'view'

export const usePortalView = () => {
    const { couponsEnabled, isHub } = useRouteLoaderData('root') as LoaderData
    const [searchParams, setSearchParams] = useSearchParams()

    const fromUrl = searchParams.get(PARAM)
    // The hub opens on Coupons; every other portal opens on Cashback.
    const wanted = fromUrl === 'coupons' || fromUrl === 'cashback'
        ? fromUrl
        : isHub ? 'coupons' : 'cashback'
    // No Coupons tab: always Cashback.
    const view: PortalView = couponsEnabled && wanted === 'coupons' ? 'coupons' : 'cashback'

    const setView = (next: PortalView) => setSearchParams(params => {
        params.set(PARAM, next)
        return params
    }, { replace: true })

    return [view, setView] as const
}
