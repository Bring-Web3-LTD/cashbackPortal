/**
 * Logic hook for the mobile outlet. Scopes the module's :global scrollbar
 * rules to the mobile tree by marking the body while it is mounted — so the
 * view is pure UI.
 */
import { useEffect } from 'react'

export const useMobileOutlet = () => {
    useEffect(() => {
        document.body.classList.add('mobile-portal')
        return () => document.body.classList.remove('mobile-portal')
    }, [])
}
