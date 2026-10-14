import { useEffect, useState } from 'react'
import { ENV } from '../config'

/**
 * Dev wrapper toggle that forces every loading placeholder on, so the skeletons
 * can be held against the design without waiting on a slow response — or
 * throttling the network to catch a state that resolves in 200ms.
 *
 * Each caller keeps its own copy rather than sharing a context: they all receive
 * the same message, so they stay in step, and nothing has to be mounted above
 * them. Prod never registers the listener, so the flag is permanently false.
 */
export const useSkeletonPreview = (): boolean => {
    const [on, setOn] = useState(false)

    useEffect(() => {
        if (ENV === 'prod') return

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window.parent) return
            const { to, action, on: value } = event.data ?? {}
            if (to !== 'bringweb3' || action !== 'PORTAL_SKELETON') return
            setOn(Boolean(value))
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    return ENV === 'prod' ? false : on
}
