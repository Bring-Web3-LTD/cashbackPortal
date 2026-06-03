import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import { HomeDispatcher, HistoryDispatcher, FaqDispatcher } from './dispatchers';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';
import fetchToken from './api/fetchToken';
import { DEV_MODE, ENV, MOBILE_PORTAL_MAX_WIDTH, MOBILE_PORTAL_PLATFORMS, SHOW_TERMS_PLATFORMS } from './config';
import { v4 } from 'uuid';
import getUserId from './utils/getUserId';
import { loadStylesheet } from './utils/loadStylesheet';

const rootLoader = async () => {
    const params = new URLSearchParams(document.location.search)
    const token = params.get('token')
    // URL-provided values are kept as a fallback for backward compatibility.
    // The token (verify response) is the newer source of truth and wins when
    // it carries the value.
    const urlExtensionId = params.get('extensionId')
    const urlTheme = params.get('theme')?.toLowerCase()
    const flowId = v4()

    // If token is provided, use it (works in both dev and prod mode)
    if (token) {
        const res = await fetchToken({ token });
        if (!res || res.status !== 200 || !res.info || !Object.keys(res.info).length) throw Error('There was an error while loading the page')
        const platform = res.info.platform?.toUpperCase() || 'DEFAULT'

        // Resolution order: token (newer) → URL (legacy) → default.
        // terms & autoclaim come from the token only (no URL fallback).
        const theme = res.info.theme?.toLowerCase() || urlTheme || 'light'
        const extensionId = res.info.extensionId || urlExtensionId || null
        const showTerms = res.info.terms !== false || SHOW_TERMS_PLATFORMS.includes(platform)
        const autoclaim = !!res.info.autoclaim
        const useMobilePortal = MOBILE_PORTAL_PLATFORMS.includes(platform) && window.innerWidth <= MOBILE_PORTAL_MAX_WIDTH

        loadStylesheet(theme, platform, useMobilePortal ? 'mobile' : 'desktop')
        // Make sure the platform translation bundle is fetched before we
        // switch to it as the default namespace; missing keys fall back
        // to DEFAULT (configured via `fallbackNS` in utils/i18n.ts).
        const activeNs = useMobilePortal ? `${platform}_MOBILE` : platform
        await i18n.loadNamespaces(useMobilePortal ? [activeNs, 'DEFAULT_MOBILE', platform] : [platform])
        i18n.setDefaultNamespace(activeNs)

        if (ENV === 'prod') {
            delete res.info.isTester
        } else {
            res.info.isTester = !!res.info.isTester
        }

        const iconsBase = useMobilePortal ? `/${platform}/mobile/icons` : `/${platform}/icons`
        const defaultIconsBase = useMobilePortal ? `/DEFAULT/mobile/icons` : `/DEFAULT/icons`

        return {
            ...res.info,
            iconsPath: `${iconsBase}/${theme}`,
            defaultIconsPath: `${defaultIconsBase}/${theme}`,
            userId: getUserId(res.info.platform),
            extensionId,
            showTerms,
            autoclaim,
            useMobilePortal,
            flowId
        }
    }

    // Fallback to dev mode parameters if no token provided
    if (DEV_MODE) {
        const theme = urlTheme || 'light'
        const showTerms = params.get('terms')?.toLowerCase() !== 'false' || SHOW_TERMS_PLATFORMS.includes((params.get('platform') || '').toUpperCase())
        const autoclaim = params.get('autoclaim') === 'true'
        const dev = {
            walletAddress: params.get('walletAddress') || null,
            platform: params.get('platform'),
            cryptoSymbols: params.get('cryptoSymbols')?.split(','),
            isCountryAvailable: true,
        }
        if (!dev.platform) throw Error('Missing platform')
        const devPlatform = dev.platform.toUpperCase()
        const useMobilePortal = MOBILE_PORTAL_PLATFORMS.includes(devPlatform) && window.innerWidth <= MOBILE_PORTAL_MAX_WIDTH
        loadStylesheet(theme, devPlatform, useMobilePortal ? 'mobile' : 'desktop')
        const activeNs = useMobilePortal ? `${devPlatform}_MOBILE` : devPlatform
        await i18n.loadNamespaces(useMobilePortal ? [activeNs, 'DEFAULT_MOBILE', devPlatform] : [devPlatform])
        i18n.setDefaultNamespace(activeNs)

        const iconsBase = useMobilePortal ? `/${devPlatform}/mobile/icons` : `/${devPlatform}/icons`
        const defaultIconsBase = useMobilePortal ? `/DEFAULT/mobile/icons` : `/DEFAULT/icons`

        return {
            ...dev,
            iconsPath: `${iconsBase}/${theme}`,
            defaultIconsPath: `${defaultIconsBase}/${theme}`,
            userId: getUserId(dev.platform),
            isTester: false,
            flowId,
            showTerms,
            autoclaim,
            useMobilePortal,
            extensionId: urlExtensionId
        }
    }

    // If no token and not in dev mode, throw error
    throw Error('There was an error while loading the page')
}

const router = createBrowserRouter([
    {
        id: "root",
        path: "/",
        element: <Layout />,
        errorElement: <ErrorMessage />,
        loader: rootLoader,
        shouldRevalidate: () => false,
        children: [
            {
                index: true,
                element: <HomeDispatcher />,
            },
            {
                path: 'history',
                element: <HistoryDispatcher />,
            },
            {
                path: 'faq',
                element: <FaqDispatcher />,
            },
        ],
    },
]);

export default router;