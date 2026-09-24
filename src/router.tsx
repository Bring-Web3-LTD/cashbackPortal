import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import { HomeDispatcher, HistoryDispatcher, FaqDispatcher } from './dispatchers';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';
import fetchToken from './api/fetchToken';
import { DEV_MODE, ENV, MOBILE_PORTAL_MAX_WIDTH, MOBILE_PORTAL_PLATFORMS, SHOW_TERMS_PLATFORMS, setCurrencyFormat } from './config';
import { v4 } from 'uuid';
import getUserId from './utils/getUserId';
import { loadStylesheet, normalizePlatform } from './utils/loadStylesheet';
import { selectVariant } from './utils/ABTest/platform-variants';

const rootLoader = async () => {
    const params = new URLSearchParams(document.location.search)
    const token = params.get('token')
    // URL-provided values are kept as a fallback for backward compatibility.
    // The token (verify response) is the newer source of truth and wins when
    // it carries the value.
    const urlExtensionId = params.get('extensionId')
    const urlTheme = params.get('theme')?.toLowerCase()
    const flowId = v4()

    // Dashboard state. The backend owns these — couponsEnabled / isHub from
    // verify, firstTimeUser from cache. Outside prod the dev wrapper may pin a
    // flag by putting an explicit true/false on the URL; anything else falls
    // through to the backend value. The override is prod-gated so a crafted
    // URL cannot flip hub/coupons behaviour for a real user.
    // firstTimeUser has no verify value — it comes from /cache at render time,
    // so the loader only carries an explicit dev override (undefined = none).
    const readOverride = (name: string): boolean | undefined => {
        if (ENV === 'prod') return undefined
        const value = params.get(name)
        return value === 'true' ? true : value === 'false' ? false : undefined
    }

    const readFlag = (name: string, fromBackend?: boolean) => {
        if (ENV !== 'prod') {
            const override = params.get(name)
            if (override === 'true') return true
            if (override === 'false') return false
        }
        return Boolean(fromBackend)
    }

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
        // styleAs overrides CSS/icons only — data still comes from real platform.
        // Sanitize: it's interpolated into stylesheet + icon URLs, so restrict
        // to a safe charset (falls back to DEFAULT) to prevent path traversal.
        const stylePlatform = normalizePlatform(params.get('styleAs') || platform)

        loadStylesheet(theme, stylePlatform, useMobilePortal ? 'mobile' : 'desktop')
        setCurrencyFormat(platform)
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

        const iconsBase = useMobilePortal ? `/${stylePlatform}/mobile/icons` : `/${stylePlatform}/icons`
        const defaultIconsBase = useMobilePortal ? `/DEFAULT/mobile/icons` : `/DEFAULT/icons`

        const userId = getUserId(res.info.platform)
        const variant = selectVariant(userId, platform)

        return {
            ...res.info,
            iconsPath: `${iconsBase}/${theme}`,
            defaultIconsPath: `${defaultIconsBase}/${theme}`,
            userId,
            extensionId,
            showTerms,
            autoclaim,
            useMobilePortal,
            flowId,
            variant,
            isHub: readFlag('isHub', res.info.isHub),
            couponsEnabled: readFlag('couponsEnabled', res.info.couponsEnabled),
            firstTimeUser: readOverride('firstTimeUser')
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
            // Mobile Portal — wallet identity normally embedded in the JWT.
            // In dev mode (no token) source them from URL params instead.
            walletName: params.get('walletName') || undefined,
            walletEmoji: params.get('walletEmoji') || undefined,
            bringTou: params.get('bringTou') || undefined,
            privacy: params.get('privacy') || undefined,
            couponsIframeSrc: params.get('couponsIframeSrc') || undefined,
            chromeStoreUrl: params.get('chromeStoreUrl') || undefined,
        }
        if (!dev.platform) throw Error('Missing platform')
        const devPlatform = dev.platform.toUpperCase()
        // styleAs=PLATFORM lets you preview a different platform's CSS/icons
        // while still loading data via devPlatform (dev-only, never sent to API).
        // Sanitize before it's interpolated into stylesheet + icon URLs.
        const stylePlatform = normalizePlatform(params.get('styleAs') || devPlatform)
        const useMobilePortal = MOBILE_PORTAL_PLATFORMS.includes(devPlatform) && window.innerWidth <= MOBILE_PORTAL_MAX_WIDTH
        loadStylesheet(theme, stylePlatform, useMobilePortal ? 'mobile' : 'desktop')
        setCurrencyFormat(devPlatform)
        const activeNs = useMobilePortal ? `${devPlatform}_MOBILE` : devPlatform
        await i18n.loadNamespaces(useMobilePortal ? [activeNs, 'DEFAULT_MOBILE', devPlatform] : [devPlatform])
        i18n.setDefaultNamespace(activeNs)

        const iconsBase = useMobilePortal ? `/${stylePlatform}/mobile/icons` : `/${stylePlatform}/icons`
        const defaultIconsBase = useMobilePortal ? `/DEFAULT/mobile/icons` : `/DEFAULT/icons`


        const userId = getUserId(dev.platform)
        const variant = selectVariant(userId, dev.platform)

        return {
            ...dev,
            iconsPath: `${iconsBase}/${theme}`,
            defaultIconsPath: `${defaultIconsBase}/${theme}`,
            userId,
            isTester: false,
            flowId,
            showTerms,
            autoclaim,
            useMobilePortal,
            extensionId: urlExtensionId,
            variant,
            isHub: readFlag('isHub'),
            couponsEnabled: readFlag('couponsEnabled'),
            firstTimeUser: readOverride('firstTimeUser')
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