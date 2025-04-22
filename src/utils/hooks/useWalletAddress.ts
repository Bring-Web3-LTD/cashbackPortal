import { useContext } from "react";
import { WalletContext } from "../../context/WalletAddressContext";

export function useWalletAddress() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWalletAddress must be used within a WalletProvider');
    }
    return context;
}