import { createContext, useState, ReactNode, useEffect } from 'react';
import fetchToken from '../api/fetchToken';
import { ENV } from '../config';
import { loadStylesheet } from '../utils/loadStylesheet';

interface WalletContextType {
    isTester: boolean
    walletAddress: string | null;
    setWalletAddress: (address: string) => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children, initialWalletAddress, initIsTester }: { children: ReactNode, initialWalletAddress: string, initIsTester: boolean }) {
    const [walletAddress, setWalletAddress] = useState<string | null>(initialWalletAddress);
    const [isTester, setIsTester] = useState(initIsTester)

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
                    if (res.info.theme) {
                        loadStylesheet(res.info.theme.toLowerCase(), res.info.platform || 'DEFAULT')
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
    }, [])

    return (
        <WalletContext.Provider value={{ isTester, walletAddress, setWalletAddress }}>
            {children}
        </WalletContext.Provider>
    );
}