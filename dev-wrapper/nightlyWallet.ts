/**
 * Nightly Wallet (Solana) adapter that satisfies the same shape as
 * `MockWallet`, so the dev wrapper's `portalBridge` can drive a real
 * extension instead of a mock when the partner platform is Solana-based
 * (e.g. nightly).
 *
 * Provider surface used (injected by the Nightly extension):
 *   window.nightly.solana.connect()                 -> { publicKey } | publicKey
 *   window.nightly.solana.signMessage(msg: Uint8Array | string)
 *                                                   -> { signature: Uint8Array }
 *   window.nightly.solana.disconnect?()             -> Promise<void>
 *   window.nightly.solana.publicKey?                -> PublicKey | null
 */

import type { MockWallet, SignResult } from './mockWallet'

interface NightlySolanaPublicKey {
    toString(): string
    toBase58?(): string
    toBytes?(): Uint8Array
}

interface NightlySolanaProvider {
    publicKey?: NightlySolanaPublicKey | null
    accounts?: Array<string | NightlySolanaPublicKey | { address?: string; publicKey?: NightlySolanaPublicKey }>
    connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: NightlySolanaPublicKey } | NightlySolanaPublicKey | { accounts?: unknown[] }>
    disconnect?(): Promise<void>
    signMessage(message: Uint8Array | string): Promise<{ signature: Uint8Array | string }>
}

declare global {
    interface Window {
        nightly?: { solana?: NightlySolanaProvider }
    }
}

// Minimal base58 encoder (Bitcoin alphabet) — Solana convention for both
// public keys and signatures. Avoids pulling in `bs58` for the dev wrapper.
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

const publicKeyToString = (pk: NightlySolanaPublicKey): string => {
    // Prefer the canonical base58 representation. Different wallet builds
    // expose this in different ways:
    //   - Solana's PublicKey: toBase58() -> base58 string
    //   - Some bundles:       toBytes() / toBuffer() -> 32-byte Uint8Array
    //   - toString() is *usually* base58, but on a few injected providers
    //     it returns hex of the underlying BN, which doesn't match the
    //     address shown in the extension UI. So we only fall back to it.
    if (typeof pk.toBase58 === 'function') return pk.toBase58()
    if (typeof pk.toBytes === 'function') return encodeBase58(pk.toBytes())
    const maybeBuffer = (pk as { toBuffer?: () => Uint8Array }).toBuffer
    if (typeof maybeBuffer === 'function') return encodeBase58(maybeBuffer.call(pk))
    return pk.toString()
}

export interface NightlyWalletOptions {
    /** Called whenever the wallet finishes a sign-message round-trip. Useful for logging. */
    onSign?: (info: { message: string; signature: string; key: string }) => void
}

export function createNightlyWallet(opts: NightlyWalletOptions = {}): MockWallet {
    const getProvider = (): NightlySolanaProvider => {
        const p = window.nightly?.solana
        if (!p) {
            throw new Error('Nightly wallet not detected. Install the Nightly extension and reload.')
        }
        return p
    }

    let address: string | null = null

    const extractAddress = (
        result: unknown,
        provider: NightlySolanaProvider,
    ): string => {
        // Preferred: provider.accounts[0] — Nightly's Solana provider exposes
        // the active address here as a plain base58 string (matches the value
        // shown in the extension UI).
        const acct = provider.accounts?.[0]
        if (typeof acct === 'string' && acct) return acct
        if (acct && typeof acct === 'object') {
            if (typeof (acct as { address?: string }).address === 'string') {
                return (acct as { address: string }).address
            }
            const pk = (acct as { publicKey?: NightlySolanaPublicKey }).publicKey
            if (pk) return publicKeyToString(pk)
        }

        // Fallbacks: connect() return value, then provider.publicKey.
        const pk =
            (result as { publicKey?: NightlySolanaPublicKey } | undefined)?.publicKey ??
            (result as NightlySolanaPublicKey | undefined) ??
            provider.publicKey ??
            null
        if (!pk) throw new Error('Nightly returned no public key')
        return publicKeyToString(pk)
    }

    return {
        getAddress: () => address,

        async connect() {
            const provider = getProvider()
            const result = await provider.connect()
            address = extractAddress(result, provider)
            return address
        },

        async disconnect() {
            const provider = window.nightly?.solana
            try {
                await provider?.disconnect?.()
            } finally {
                address = null
            }
        },

        async signMessage(message: string): Promise<SignResult> {
            const provider = getProvider()
            if (!address) {
                // Re-establish the session if the user disconnected externally.
                const result = await provider.connect()
                address = extractAddress(result, provider)
            }

            // Nightly accepts both `Uint8Array` and `string`. Passing the
            // raw string lets the wallet UI render the human-readable
            // message instead of a list of byte values.
            console.log('[nightly] signMessage request', { message })
            const rawResponse = await provider.signMessage(message)
            console.log('[nightly] signMessage raw response', rawResponse)
            // Nightly's Solana provider returns the signature bytes
            // directly (`Uint8Array(64)`), but some wallet adapters wrap
            // it as `{ signature }`. Accept either shape.
            const signature: Uint8Array | string =
                rawResponse instanceof Uint8Array
                    ? rawResponse
                    : rawResponse?.signature

            const sigBytes =
                typeof signature === 'string'
                    ? new TextEncoder().encode(signature) // very unlikely; keep TS happy
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
