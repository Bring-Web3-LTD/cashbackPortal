import { createContext, useState, ReactNode, useEffect } from 'react';
import fetchToken from '../api/fetchToken';

interface WalletContextType {
    walletAddress: string | null;
    setWalletAddress: (address: string) => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children, initialWalletAddress }: { children: ReactNode, initialWalletAddress: string }) {
    const [walletAddress, setWalletAddress] = useState<string | null>(initialWalletAddress);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.action === 'WALLET_ADDRESS_UPDATE') {
                console.log('BRING! Received message:', event);
                const { token } = event.data
                if (token) {
                    const res = await fetchToken(token)
                    console.log({ fetchToken: res });

                    setWalletAddress(res.info.walletAddress || null)
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [])

    return (
        <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
            {children}
        </WalletContext.Provider>
    );
}