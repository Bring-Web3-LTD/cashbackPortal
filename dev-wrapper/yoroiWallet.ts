/**
 * Yoroi Wallet (Cardano, CIP-30) adapter that satisfies the same shape as
 * `MockWallet`, so the dev wrapper's `portalBridge` can drive the real
 * Yoroi extension instead of a mock when the partner platform is YOROI.
 *
 * Provider surface used (CIP-30, injected by Yoroi):
 *   await window.cardano.yoroi.enable()   -> CIP-30 `api`
 *   await api.getChangeAddress()          -> hex-encoded address bytes
 *   await api.signData(addrHex, payloadHex)
 *                                          -> { signature: hex<COSE_Sign1>, key: hex<COSE_Key> }
 *   await window.cardano.yoroi.isEnabled()
 *
 * Notes:
 *   - CIP-30 returns addresses as hex bytes; partners expect Bech32, so we
 *     embed a tiny bech32 encoder (network-aware: `addr`/`addr_test`).
 *   - `signData` requires a hex payload; we hex-encode the UTF-8 bytes of
 *     the message string.
 */

import type { MockWallet, SignResult } from './mockWallet'

interface YoroiCip30Api {
    getChangeAddress(): Promise<string> // hex bytes
    getUsedAddresses?(): Promise<string[]>
    getNetworkId?(): Promise<number>
    signData(addr: string, payloadHex: string): Promise<{ signature: string; key: string }>
}

interface YoroiInitial {
    name?: string
    apiVersion?: string
    isEnabled(): Promise<boolean>
    enable(): Promise<YoroiCip30Api>
}

declare global {
    interface Window {
        cardano?: Record<string, YoroiInitial | undefined> & { yoroi?: YoroiInitial }
    }
}

// ---- Hex / Bech32 helpers (Cardano addresses) ------------------------------

const hexToBytes = (hex: string): Uint8Array => {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex
    if (clean.length % 2 !== 0) throw new Error('Invalid hex string')
    const out = new Uint8Array(clean.length / 2)
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
    return out
}

const bytesToHex = (bytes: Uint8Array): string =>
    Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

// Minimal Bech32 encoder (BIP-173). Cardano uses the original variant, not Bech32m.
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

const bech32Polymod = (values: number[]): number => {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    let chk = 1
    for (const v of values) {
        const top = chk >>> 25
        chk = ((chk & 0x1ffffff) << 5) ^ v
        for (let i = 0; i < 5; i++) {
            if ((top >> i) & 1) chk ^= GEN[i]
        }
    }
    return chk
}

const bech32HrpExpand = (hrp: string): number[] => {
    const out: number[] = []
    for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5)
    out.push(0)
    for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31)
    return out
}

const bech32CreateChecksum = (hrp: string, data: number[]): number[] => {
    const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0])
    const mod = bech32Polymod(values) ^ 1
    const out: number[] = []
    for (let p = 0; p < 6; p++) out.push((mod >> (5 * (5 - p))) & 31)
    return out
}

const convertBits = (
    data: ArrayLike<number>,
    fromBits: number,
    toBits: number,
    pad: boolean,
): number[] => {
    let acc = 0
    let bits = 0
    const out: number[] = []
    const maxv = (1 << toBits) - 1
    for (let i = 0; i < data.length; i++) {
        const v = data[i]
        if (v < 0 || v >> fromBits !== 0) throw new Error('Invalid value for convertBits')
        acc = (acc << fromBits) | v
        bits += fromBits
        while (bits >= toBits) {
            bits -= toBits
            out.push((acc >> bits) & maxv)
        }
    }
    if (pad && bits > 0) out.push((acc << (toBits - bits)) & maxv)
    return out
}

const bech32Encode = (hrp: string, bytes: Uint8Array, limit = 1023): string => {
    const data = convertBits(bytes, 8, 5, true)
    const combined = data.concat(bech32CreateChecksum(hrp, data))
    let str = `${hrp}1`
    for (const d of combined) str += BECH32_CHARSET.charAt(d)
    if (str.length > limit) throw new Error('Bech32 string too long')
    return str
}

// Cardano address header byte's lowest 4 bits encode the network (0=test, 1=mainnet).
const addressHexToBech32 = (hex: string): string => {
    const bytes = hexToBytes(hex)
    if (!bytes.length) throw new Error('Empty address')
    const network = bytes[0] & 0x0f
    const hrp = network === 1 ? 'addr' : 'addr_test'
    return bech32Encode(hrp, bytes)
}

// ---- Adapter --------------------------------------------------------------

export interface YoroiWalletOptions {
    onSign?: (info: { message: string; signature: string; key: string }) => void
}

export function createYoroiWallet(opts: YoroiWalletOptions = {}): MockWallet {
    const getInitial = (): YoroiInitial => {
        const y = window.cardano?.yoroi
        if (!y) {
            throw new Error('Yoroi wallet not detected. Install the Yoroi extension and reload.')
        }
        return y
    }

    let api: YoroiCip30Api | null = null
    let address: string | null = null // bech32
    let addressHex: string | null = null // raw hex needed for signData

    const ensureApi = async (): Promise<YoroiCip30Api> => {
        if (api) return api
        api = await getInitial().enable()
        return api
    }

    const refreshAddress = async (a: YoroiCip30Api) => {
        // Prefer a used address (more stable across dApp sessions); fall back
        // to the change address.
        let hex: string | undefined
        try {
            const used = await a.getUsedAddresses?.()
            hex = used?.[0]
        } catch {
            /* ignore — some wallets refuse before user interaction */
        }
        if (!hex) hex = await a.getChangeAddress()
        addressHex = hex
        address = addressHexToBech32(hex)
    }

    return {
        getAddress: () => address,

        async connect() {
            const a = await ensureApi()
            await refreshAddress(a)
            return address!
        },

        async disconnect() {
            // CIP-30 has no programmatic disconnect; the user revokes from the
            // extension UI. Drop our cached state so the next connect() prompts
            // again if access has been revoked.
            api = null
            address = null
            addressHex = null
        },

        async signMessage(message: string): Promise<SignResult> {
            const a = await ensureApi()
            if (!addressHex) await refreshAddress(a)

            const payloadHex = bytesToHex(new TextEncoder().encode(message))
            console.log('[yoroi] signData request', { addr: address, message })
            const rawResponse = await a.signData(addressHex!, payloadHex)
            console.log('[yoroi] signData raw response', rawResponse)

            // CIP-30 returns COSE_Sign1 + COSE_Key as hex-encoded CBOR. Pass
            // the signature through as-is; the partner backend decodes it.
            const result: SignResult = {
                signature: rawResponse.signature,
                key: address!,
                message,
            }
            opts.onSign?.(result)
            return result
        },
    }
}
