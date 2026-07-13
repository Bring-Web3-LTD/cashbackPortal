import { FC, createContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import analytics from '../api/analytics';
import { useWalletAddress } from '../hooks/useWalletAddress';

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
    | "topbar_back"
    | "page_view"

interface AnalyticsEvent {
    category: "user_action" | "system";
    action?: "click" | "input" | "select" | "request";
    details?: unknown;
    process?: string;
    // Extra fields are forwarded verbatim to the backend analytics payload.
    [key: string]: unknown;
}

export interface AnalyticsContextType {
    sendAnalyticsEvent: (name: EventName, event: AnalyticsEvent) => Promise<void>;
}

export const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface Props {
    children: ReactNode
    platform: string
    location: string
    userId: string
    flowId: string
}

export const AnalyticsProvider: FC<Props> = ({ children, platform, location, flowId, userId }) => {
    const effectRan = useRef('')
    const { walletAddress } = useWalletAddress()

    const sendBackendEvent = useCallback(async (name: EventName, event: AnalyticsEvent) => {

        if (event.details && typeof event.details === 'object' && !Array.isArray(event.details)) {
            const tmpEvent = structuredClone({ ...event, ...event.details })
            delete tmpEvent.details
            event = tmpEvent
        }

        const backendEvent: Parameters<typeof analytics>[0] = {
            ...event,
            type: name,
            platform,
            userId,
            flowId,
        }

        if (walletAddress) backendEvent.walletAddress = walletAddress

        try {
            return await analytics(backendEvent)
        } catch (error) {
            console.error('BRING: Error sending analytics event', error)
            return { success: false, error }
        }
    }, [flowId, platform, walletAddress, userId])

    useEffect(() => {
        if (window.origin.includes('localhost')) {
            return
        }

        if (effectRan.current === location) return

        const details: { [key: string]: string } = {
            pageLocation: window.location.href,
            pagePath: window.location.pathname,
            pageTitle: document.title,
            parentLocation: location
        }

        sendBackendEvent('page_view', {
            category: 'system',
            details
        })

        effectRan.current = location
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    const sendAnalyticsEvent = async (name: EventName, event: AnalyticsEvent): Promise<void> => {

        if (window.origin.includes('localhost')) return

        await sendBackendEvent(name, event)
    };

    return (
        <AnalyticsContext.Provider value={{ sendAnalyticsEvent }}>
            {children}
        </AnalyticsContext.Provider>
    );
};
