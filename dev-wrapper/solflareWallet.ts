/**
 * Solflare Wallet (Solana) adapter that satisfies the same shape as
 * `MockWallet`, so the dev wrapper's `portalBridge` can drive the real
 * Solflare extension instead of a mock when the partner platform is
 * Solana-based.
 *
 * Provider surface used (injected by the Solflare extension):
 *   window.solflare.connect()                       -> Promise<void>
 *                                                      (publicKey set on the provider after resolve)
 *   window.solflare.disconnect()                    -> Promise<void>
 *   window.solflare.signMessage(msg: Uint8Array, encoding?: 'utf8' | 'hex')
 *                                                   -> Uint8Array | { signature: Uint8Array }
 *   window.solflare.publicKey                       -> PublicKey | null
 *   window.solflare.isConnected                     -> boolean
 */

import type { MockWallet, SignResult } from './mockWallet'

interface SolflarePublicKey {
    toString(): string
    toBase58?(): string
    toBytes?(): Uint8Array
}

interface SolflareProvider {
    publicKey?: SolflarePublicKey | null
    isConnected?: boolean
    connect(): Promise<void | { publicKey: SolflarePublicKey }>
    disconnect?(): Promise<void>
    signMessage(
        message: Uint8Array,
        encoding?: 'utf8' | 'hex',
    ): Promise<Uint8Array | { signature: Uint8Array | string }>
}

declare global {
    interface Window {
        solflare?: SolflareProvider
    }
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function encodeBase58(bytes: Uint8Array): string {
    let zeros = 0
    while (zeros < bytes.length && bytes[zeros] === 0) zeros++

    const digits: number[] = []
    for (let i = zeros; i < bytes.length; i++) {
        let carry = bytes[i]
        for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8
            digits[j] = carry % 58
            carry = (carry / 58) | 0
        }
        while (carry > 0) {
            digits.push(carry % 58)
            carry = (carry / 58) | 0
        }
    }

    let out = ''
    for (let i = 0; i < zeros; i++) out += '1'
    for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]]
    return out
}

const publicKeyToString = (pk: SolflarePublicKey): string => {
    if (typeof pk.toBase58 === 'function') return pk.toBase58()
    if (typeof pk.toBytes === 'function') return encodeBase58(pk.toBytes())
    const maybeBuffer = (pk as { toBuffer?: () => Uint8Array }).toBuffer
    if (typeof maybeBuffer === 'function') return encodeBase58(maybeBuffer.call(pk))
    return pk.toString()
}

export interface SolflareWalletOptions {
    onSign?: (info: { message: string; signature: string; key: string }) => void
}

export function createSolflareWallet(opts: SolflareWalletOptions = {}): MockWallet {
    const getProvider = (): SolflareProvider => {
        const p = window.solflare
        if (!p) {
            throw new Error('Solflare wallet not detected. Install the Solflare extension and reload.')
        }
        return p
    }

    let address: string | null = null

    const readAddress = (provider: SolflareProvider): string => {
        const pk = provider.publicKey
        if (!pk) throw new Error('Solflare returned no public key')
        return publicKeyToString(pk)
    }

    return {
        getAddress: () => address,

        async connect() {
            const provider = getProvider()
            const result = await provider.connect()
            // Solflare's connect() resolves with `void` and sets `publicKey`
            // on the provider, but some builds return `{ publicKey }`.
            const pk =
                (result as { publicKey?: SolflarePublicKey } | undefined)?.publicKey ??
                provider.publicKey
            if (!pk) throw new Error('Solflare returned no public key')
            address = publicKeyToString(pk)
            return address
        },

        async disconnect() {
            const provider = window.solflare
            try {
                await provider?.disconnect?.()
            } finally {
                address = null
            }
        },

        async signMessage(message: string): Promise<SignResult> {
            const provider = getProvider()
            if (!address || !provider.isConnected) {
                await provider.connect()
                address = readAddress(provider)
            }

            // Solflare requires a Uint8Array for the message payload.
            const encoded = new TextEncoder().encode(message)
            console.log('[solflare] signMessage request', { message })
            const rawResponse = await provider.signMessage(encoded, 'utf8')
            console.log('[solflare] signMessage raw response', rawResponse)

            // Accept either bare bytes or a `{ signature }` wrapper.
            const signature: Uint8Array | string =
                rawResponse instanceof Uint8Array
                    ? rawResponse
                    : (rawResponse as { signature: Uint8Array | string }).signature

            const sigBytes =
                typeof signature === 'string'
                    ? new TextEncoder().encode(signature)
                    : signature
            const signatureBase58 = encodeBase58(sigBytes)

            const result: SignResult = {
                signature: signatureBase58,
                key: address!,
                message,
            }
            opts.onSign?.(result)
            return result
        },
    }
}
