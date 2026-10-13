/**
 * Logic hook for the dashboard bar. Owns the onboarding-vs-rewards decision,
 * the two modals' state, the dev wrapper's flag report and its pairing jump —
 * so the view is pure UI.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../utils/message'
import { useBalance, selectFirstTimeUser } from '../../hooks/useBalance'
import { useSkeletonPreview } from '../../hooks/useSkeletonPreview'
import { ENV } from '../../config'

export const useDashboard = () => {
    const { t } = useTranslation()
    const { isHub, couponsEnabled, firstTimeUser: firstTimeOverride } = useRouteLoaderData('root') as LoaderData

    // Optimistically onboarding until /cache says the user already has
    // activity. Re-derived from the live query, so earning a first reward
    // leaves the onboarding state without waiting for a reload.
    const { data: balance, isLoading: balanceLoading } = useBalance()
    const skeletonPreview = useSkeletonPreview()

    // What /cache says, or the true default when it has not answered — which
    // includes after a disconnect, since the query is keyed on the address and
    // its data goes with it.
    const backendFirstTimeUser = selectFirstTimeUser(balance)

    // Only the portal calls /cache, so report the resolved flag back to the
    // dev wrapper for its Dashboard flags panel. Dev only — the embedding host
    // in production has no use for it.
    useEffect(() => {
        if (ENV === 'prod') return
        message({
            action: 'PORTAL_FLAGS',
            isHub: Boolean(isHub),
            couponsEnabled: Boolean(couponsEnabled),
            firstTimeUser: backendFirstTimeUser,
        })
    }, [isHub, couponsEnabled, backendFirstTimeUser])

    const [explainOpen, setExplainOpen] = useState(false)
    const [pairOpen, setPairOpen] = useState(false)

    // The dev wrapper's screen picker jumps into the pairing flow, which needs
    // the modal open first. usePairWallet applies the screen itself.
    useEffect(() => {
        if (ENV === 'prod') return
        const openForDev = (event: MessageEvent) => {
            if (event.source !== window.parent) return
            if (event.data?.to !== 'bringweb3' || event.data.action !== 'PAIR_DEV_OPEN') return
            setPairOpen(true)
        }
        window.addEventListener('message', openForDev)
        return () => window.removeEventListener('message', openForDev)
    }, [])

    return {
        // Wallet apps hold an address already; pairing ends in a signature,
        // which the hub has no wallet for.
        showPairWallet: !isHub,
        couponsEnabled,
        showSkeleton: balanceLoading || skeletonPreview,
        firstTimeUser: firstTimeOverride ?? backendFirstTimeUser,
        explainOpen,
        openExplain: () => setExplainOpen(true),
        closeExplain: () => setExplainOpen(false),
        pairOpen,
        openPair: () => setPairOpen(true),
        closePair: () => setPairOpen(false),
        labels: {
            couponsTab: t('couponsTab'),
            cashbackTab: t('cashbackTab'),
            welcomeTitle: t('welcomeTitle'),
            welcomeText: t('welcomeText'),
            pairWallet: t('pairWallet'),
            whatsThis: t('whatsThis'),
        },
    }
}
