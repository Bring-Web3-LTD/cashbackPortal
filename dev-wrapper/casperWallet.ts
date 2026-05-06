/**
 * Casper Wallet (CSPR) adapter — connect + sign.
 *
 * Provider surface used (Casper Wallet SDK injects a factory into window):
 *   const provider = window.CasperWalletProvider()
 *   await provider.requestConnection()      -> boolean
 *   await provider.getActivePublicKey()     -> hex string
 *   await provider.signMessage(message, signingPublicKeyHex)
 *     -> { cancelled: true } | { cancelled: false, signatureHex, signature: Uint8Array }
 *   await provider.disconnectFromSite()
 */

import type { MockWallet, SignResult } from './mockWallet'

interface CasperSignResponse {
    cancelled: boolean
    signatureHex?: string
    signature?: Uint8Array
}

interface CasperWalletProvider {
    requestConnection(): Promise<boolean>
    isConnected(): Promise<boolean>
    getActivePublicKey(): Promise<string>
    signMessage(message: string, signingPublicKeyHex: string): Promise<CasperSignResponse>
    disconnectFromSite(): Promise<boolean>
}

declare global {
    interface Window {
        CasperWalletProvider?: (opts?: { timeout?: number }) => CasperWalletProvider
    }
}

export interface CasperWalletOptions {
    onSign?: (info: { message: string; signature: string; key: string }) => void
}

export function createCasperWallet(opts: CasperWalletOptions = {}): MockWallet {
    const getProvider = (): CasperWalletProvider => {
        const factory = window.CasperWalletProvider
        if (!factory) {
            throw new Error('Casper Wallet not detected. Install the Casper Wallet extension and reload.')
        }
        return factory()
    }

    let provider: CasperWalletProvider | null = null
    let address: string | null = null

    const ensureProvider = (): CasperWalletProvider => {
        if (!provider) provider = getProvider()
        return provider
    }

    return {
        getAddress: () => address,

        async connect() {
            const p = ensureProvider()
            const ok = await p.requestConnection()
            if (!ok) throw new Error('Casper Wallet connect was rejected')
            address = await p.getActivePublicKey()
            return address
        },

        async disconnect() {
            try {
                await provider?.disconnectFromSite()
            } catch {
                /* ignore */
            } finally {
                address = null
            }
        },

        async signMessage(message: string): Promise<SignResult> {
            const p = ensureProvider()
            if (!address) {
                await p.requestConnection()
                address = await p.getActivePublicKey()
            }

            console.log('[casper] signMessage request', { message, key: address })
            const rawResponse = await p.signMessage(message, address!)
            console.log('[casper] signMessage raw response', rawResponse)

            if (rawResponse.cancelled || !rawResponse.signatureHex) {
                throw new Error('Casper Wallet sign was cancelled')
            }

            const result: SignResult = {
                signature: rawResponse.signatureHex,
                key: address!,
                message,
            }
            opts.onSign?.(result)
            return result
        },
    }
}
