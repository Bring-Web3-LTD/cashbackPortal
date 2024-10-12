import { FC, createContext, useEffect, ReactNode } from 'react';
import ReactGA from 'react-ga4';

type EventName =
    | "retailer_open"
    | "retailer_shop"
    | "rewards_open"
    | "popup_close"
    | "clear_selection"
    | "search_input"
    | "search_select"
    | "history_expand"
    | "category_select"
    | "claim_open"
    | "claim_submit"
    | "claim_accepted"
    | "claim_failed"

interface GAEvent {
    category: "user_action" | "system";
    action?: "click" | "input" | "select" | "request";
    details?: string;
    process?: "activate" | "initiate" | "submit";
}

interface GoogleAnalyticsContextType {
    sendGaEvent: (name: EventName, event: GAEvent) => void;
    sendPageViewEvent: (path: string) => void;
}

export const GoogleAnalyticsContext = createContext<GoogleAnalyticsContextType | undefined>(undefined);

export const GoogleAnalyticsProvider: FC<{ measurementId: string; children: ReactNode, platform: string, walletAddress: string }> = ({ measurementId, children, platform, walletAddress }) => {
    useEffect(() => {
        if (ReactGA.isInitialized && measurementId) return;

        ReactGA.initialize(measurementId, {
            gaOptions: {
                storage: 'none',
                storeGac: false,
                cookieFlags: 'SameSite=None;Secure'
            },
            gtagOptions: {
                anonymize_ip: true,
                cookie_update: false
            }
        });

        sendPageViewEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendPageViewEvent = (): void => {
        if (window.origin.includes('localhost')) {
            return
        }
        if (!ReactGA.isInitialized) {
            console.warn('BRING: Google Analytics is not initialized');
            return
        }
        ReactGA.send({
            hitType: 'pageview',
            page_location: window.location.href,
            page_path: window.location.pathname,
            page_title: document.title
        });
    };

    const sendGaEvent = (name: EventName, event: GAEvent): void => {
        if (window.origin.includes('localhost')) {
            return
        }
        if (!ReactGA.isInitialized) {
            console.warn('BRING: Google Analytics is not initialized');
            return
        }

        const params: { [key: string]: unknown } = {
            ...event,
            platform,
            source: 'extension'
        }

        if (walletAddress) params.walletAddress = walletAddress
        ReactGA.event(name, params)
    };

    return (
        <GoogleAnalyticsContext.Provider value={{ sendGaEvent, sendPageViewEvent }}>
            {children}
        </GoogleAnalyticsContext.Provider>
    );
};