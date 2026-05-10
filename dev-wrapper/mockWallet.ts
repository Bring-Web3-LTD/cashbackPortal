/**
 * Minimal mock wallet — stands in for a real wallet SDK
 * Knows nothing about Bring or the iframe protocol. Exposes the small surface
 * a partner integration would call into: connect, signMessage, disconnect,
 * getAddress.
 */

const randomHex = (bytes: number) =>
    Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

const generateMockAddress = () => `0x${randomHex(20)}`
const generateMockSignature = () => `0x${randomHex(65)}`
const generateMockKey = () => `0x${randomHex(33)}`

export interface SignResult {
    signature: string
    key: string
    message: string
}

export interface MockWalletOptions {
    /** Optional preferred address used by `connect()` when no override is given. */
    getPreferredAddress?: () => string
}

export interface MockWallet {
    getAddress(): string | null
    connect(address?: string): Promise<string>
    signMessage(message: string): Promise<SignResult>
    disconnect(): Promise<void>
}

export function createMockWallet(opts: MockWalletOptions = {}): MockWallet {
    let address: string | null = null

    return {
        getAddress: () => address,

        async connect(override) {
            address = override || opts.getPreferredAddress?.() || generateMockAddress()
            return address
        },

        async signMessage(message) {
            if (!address) throw new Error('Wallet not connected')
            return {
                signature: generateMockSignature(),
                key: generateMockKey(),
                message,
            }
        },

        async disconnect() {
            address = null
        },
    }
}
