import { createContext, useState, ReactNode, useEffect } from 'react';
import fetchToken from '../api/fetchToken';
import { ENV } from '../config';
import { loadStylesheet } from '../utils/loadStylesheet';
import type { StylesheetMode } from '../utils/loadStylesheet';

interface WalletContextType {
    isTester: boolean
    walletAddress: string | null;
    setWalletAddress: (address: string) => void;
    /** Wallet display name — from the JWT (verify) or dev URL params. */
    walletName?: string;
    /** Wallet emoji asset URL — from the JWT (verify) or dev URL params. */
    walletEmoji?: string;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({
    children,
    initialWalletAddress,
    initIsTester,
    initialWalletName,
    initialWalletEmoji,
    mode = 'desktop',
}: {
    children: ReactNode,
    initialWalletAddress: string,
    initIsTester: boolean,
    initialWalletName?: string,
    initialWalletEmoji?: string,
    // Current portal mode — preserved when a SESSION_UPDATE re-themes, so the
    // mobile stylesheet tags aren't stripped by a default 'desktop' call.
    mode?: StylesheetMode,
}) {
    const [walletAddress, setWalletAddress] = useState<string | null>(initialWalletAddress);
    const [isTester, setIsTester] = useState(initIsTester)
    // Wallet identity is seeded from the loader (JWT or dev URL params) and
    // refreshed on SESSION_UPDATE whenever the new token carries it, so a
    // wallet switch updates the name/emoji without a full reload.
    const [walletName, setWalletName] = useState<string | undefined>(initialWalletName)
    const [walletEmoji, setWalletEmoji] = useState<string | undefined>(initialWalletEmoji)

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = event.data
            // Validate message shape before trusting the payload.
            if (!data || typeof data !== 'object') return
            // `SESSION_UPDATE` is the current name; `WALLET_ADDRESS_UPDATE` is
            // kept as a legacy alias so existing partner integrations keep
            // working. Both carry the same `{ token }` payload.
            if (data.action === 'SESSION_UPDATE' || data.action === 'WALLET_ADDRESS_UPDATE') {
                const { token } = data
                if (token) {
                    const res = await fetchToken({ token })
                    setWalletAddress(res.info.walletAddress || null)
                    setIsTester(!!res.info.isTester && ENV !== 'prod')
                    // Only overwrite when the new token actually carries the
                    // field — otherwise keep the value seeded from the loader
                    // (e.g. dev URL params the JWT doesn't echo).
                    if (res.info.walletName) setWalletName(res.info.walletName)
                    if (res.info.walletEmoji) setWalletEmoji(res.info.walletEmoji)
                    if (res.info.theme) {
                        loadStylesheet(res.info.theme.toLowerCase(), res.info.platform || 'DEFAULT', mode)
                    }
                }
                else if (ENV === 'development') {
                    setWalletAddress(data.walletAddress || null)
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [mode])

    return (
        <WalletContext.Provider value={{ isTester, walletAddress, setWalletAddress, walletName, walletEmoji }}>
            {children}
        </WalletContext.Provider>
    );
}