import { useContext } from 'react'
import { ClaimContext } from '../context/ClaimContext'

/** The desktop claim flow. Only available under ClaimProvider. */
export const useClaim = () => {
    const context = useContext(ClaimContext)
    if (!context) throw Error('useClaim must be used within a ClaimProvider')
    return context
}
