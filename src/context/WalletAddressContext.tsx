import { createContext, useState, ReactNode, useEffect } from 'react';
import fetchToken from '../api/fetchToken';
import { ENV } from '../config';

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
            if (event.data.action === 'WALLET_ADDRESS_UPDATE') {
                const { token } = event.data
                if (token) {
                    const res = await fetchToken({ token })
                    setWalletAddress(res.info.walletAddress || null)
                    setIsTester(!!res.info.isTester && ENV !== 'prod')
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