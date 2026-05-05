/**
 * Bring Cashback Portal integration bridge.
 *
 * This is the partner-owned glue between the portal iframe (postMessage
 * protocol) and a wallet SDK. In a real partner site this file would be
 * roughly the same — the only thing that changes is the `wallet` adapter
 * passed in (MetaMask, ethers signer, …).
 *
 * Protocol summary:
 *   ← from portal: { from: 'bringweb3', action: 'LOGIN' | 'SIGN_MESSAGE' | 'POPUP_CLOSED', ... }
 *   → to portal:   { to:   'bringweb3', action: 'SESSION_UPDATE' | 'SIGNATURE' | 'ABORT_SIGN_MESSAGE', ... }
 */

import type { MockWallet } from './mockWallet'

export type LogKind = 'in' | 'out' | 'err' | 'info'

export interface LogFn {
    (kind: LogKind, label: string, payload?: unknown): void
}

const PORTAL_TAG = 'bringweb3'

export interface PortalBridgeOptions {
    iframe: HTMLIFrameElement
    wallet: MockWallet
    log?: LogFn
    /**
     * Called whenever the wallet address changes. The bridge expects a
     * Promise<string> resolving to a fresh JWT bound to the new address
     * (typically obtained by re-calling `check/portal`). The token is then
     * pushed to the portal via `SESSION_UPDATE`.
     */
    refreshToken: (address: string | null) => Promise<string | null>
    /** Called when an address change has been pushed to the portal. */
    onAddressChange?: (address: string | null) => void
    /** If false, the bridge will not auto-call `wallet.connect()` on `LOGIN`. */
    shouldAutoConnect?: () => boolean
    /** If false, the bridge will not auto-call `wallet.signMessage()` on `SIGN_MESSAGE`. */
    shouldAutoSign?: () => boolean
}

export function createPortalBridge(opts: PortalBridgeOptions) {
    const {
        iframe,
        wallet,
        log = () => {},
        refreshToken,
        onAddressChange,
        shouldAutoConnect = () => true,
        shouldAutoSign = () => true,
    } = opts

    const post = (data: Record<string, unknown>, label: string) => {
        try {
            const targetOrigin = new URL(iframe.src).origin
            iframe.contentWindow?.postMessage({ ...data, to: PORTAL_TAG }, targetOrigin)
            log('out', label, data)
        } catch (err) {
            log('err', `Failed to post ${label}`, (err as Error).message)
        }
    }

    /**
     * Refresh the JWT for the current wallet address and push it to the
     * portal. The portal extracts the new walletAddress from the verify
     * response, so we do **not** include `walletAddress` in the message.
     */
    const pushAddress = async (address: string | null) => {
        try {
            const token = await refreshToken(address)
            if (token) {
                post({ action: 'SESSION_UPDATE', token }, address ? 'SESSION_UPDATE' : 'SESSION_UPDATE (disconnect)')
            }
        } catch (err) {
            log('err', 'refreshToken failed', (err as Error).message)
        }
        onAddressChange?.(address)
    }

    const connect = async (override?: string) => {
        const address = await wallet.connect(override)
        await pushAddress(address)
        return address
    }

    const disconnect = async () => {
        await wallet.disconnect()
        await pushAddress(null)
    }

    const signAndPost = async (message: string) => {
        try {
            const { signature, key, message: msg } = await wallet.signMessage(message)
            post({ action: 'SIGNATURE', signature, key, message: msg }, 'SIGNATURE')
        } catch (err) {
            log('err', 'signMessage failed', (err as Error).message)
            post({ action: 'ABORT_SIGN_MESSAGE' }, 'ABORT_SIGN_MESSAGE')
        }
    }

    const abortSign = () => {
        post({ action: 'ABORT_SIGN_MESSAGE' }, 'ABORT_SIGN_MESSAGE')
    }

    const onMessage = (event: MessageEvent) => {
        const data = event.data as { from?: string; to?: string; action?: string; [k: string]: unknown }
        if (!data || data.from !== PORTAL_TAG || !data.action) return
        // Ignore our own outbound messages echoed back.
        if (data.to === PORTAL_TAG) return

        log('in', data.action, data)

        switch (data.action) {
            case 'LOGIN':
                if (shouldAutoConnect()) void connect()
                break
            case 'SIGN_MESSAGE':
                if (shouldAutoSign()) void signAndPost(String(data.messageToSign ?? ''))
                break
            case 'POPUP_CLOSED':
                // Visibility only.
                break
            default:
                break
        }
    }

    window.addEventListener('message', onMessage)

    return {
        connect,
        disconnect,
        abortSign,
        signMessage: signAndPost,
        destroy: () => window.removeEventListener('message', onMessage),
    }
}
