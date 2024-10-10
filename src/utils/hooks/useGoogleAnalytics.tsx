import { useContext } from "react";
import { GoogleAnalyticsContext } from "../../context/GoogleAnalyticsContext";

export const useGoogleAnalytics = (): GoogleAnalyticsContextType => {
    const context = useContext(GoogleAnalyticsContext);
    if (context === undefined) {
        throw new Error('useGoogleAnalytics must be used within a GoogleAnalyticsProvider');
    }
    return context;
};