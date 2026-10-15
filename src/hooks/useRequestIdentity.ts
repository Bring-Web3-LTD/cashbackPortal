/**
 * Who the backend should credit for a request. Wallet mode sends the wallet
 * address and the browser id; hub mode sends neither, so the backend falls
 * back to the session cookie.
 */
import { useMemo } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from './useWalletAddress'

type Identity = Pick<BackendRequestBody, 'userId' | 'walletAddress'>

export const useRequestIdentity = () => {
    const { userId, isHub } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()

    const identity = useMemo<Identity>(
        () => (isHub ? {} : { userId, walletAddress: walletAddress ?? undefined }),
        [isHub, userId, walletAddress],
    )

    return {
        identity,
        /** Hub users are identified by their session, wallet users by their address. */
        isIdentified: Boolean(isHub || walletAddress),
    }
}
