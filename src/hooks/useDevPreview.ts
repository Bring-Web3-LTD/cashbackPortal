import { useEffect, useState } from 'react'
import { ENV } from '../config'

/**
 * Dev wrapper on/off toggles, one per message action. The wrapper posts
 * `{ to: 'bringweb3', action, on }` and re-sends it on every portal load,
 * since the flag lives only in the portal's memory.
 *
 * Each caller keeps its own copy rather than sharing a context: they all receive
 * the same message, so they stay in step, and nothing has to be mounted above
 * them. Prod never registers the listener, so the flag is permanently false.
 */
const useDevPreview = (action: string): boolean => {
    const [on, setOn] = useState(false)

    useEffect(() => {
        if (ENV === 'prod') return

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window.parent) return
            const { to, action: incoming, on: value } = event.data ?? {}
            if (to !== 'bringweb3' || incoming !== action) return
            setOn(Boolean(value))
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [action])

    return ENV === 'prod' ? false : on
}

/** Forces every loading placeholder on, to hold a skeleton against the design. */
export const useSkeletonPreview = (): boolean => useDevPreview('PORTAL_SKELETON')

/**
 * Shows the Claim button as enabled with no balance, to check its live styling.
 * Look only: a click does nothing, there is nothing to claim.
 */
export const useClaimPreview = (): boolean => useDevPreview('PORTAL_CLAIM_PREVIEW')
