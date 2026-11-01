/**
 * Who the backend should credit for a request. Wallet mode sends the wallet
 * address and the browser id; hub mode sends neither, so the backend falls
 * back to the session cookie; the CAB sends the userId the extension kit
 * created at install, and nothing until the kit has answered with it.
 */
import { useMemo } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from './useWalletAddress'

type Identity = Pick<BackendRequestBody, 'userId' | 'walletAddress'>

export const useRequestIdentity = () => {
    const { userId, isHub, isCab, hubWalletBalance } = useRouteLoaderData('root') as LoaderData
    const { walletAddress, kitUserId } = useWalletAddress()

    const identity = useMemo<Identity>(
        () => isCab
            ? (kitUserId ? { userId: kitUserId } : {})
            : isHub
                // Dev override: stand in for the session cookie with the wallet
                // the wrapper connected, so a hub balance loads locally.
                ? (hubWalletBalance && walletAddress ? { walletAddress } : {})
                : { userId, walletAddress: walletAddress ?? undefined },
        [isCab, kitUserId, isHub, hubWalletBalance, userId, walletAddress],
    )

    return {
        identity,
        /** Hub users are identified by their session, CAB users by the kit's
         *  userId once it has arrived, wallet users by their address. */
        isIdentified: isCab ? Boolean(kitUserId) : Boolean(isHub || walletAddress),
    }
}
