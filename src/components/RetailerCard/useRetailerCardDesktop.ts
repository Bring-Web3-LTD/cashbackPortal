/**
 * Logic hook for the desktop retailer card. Owns the activation round-trip,
 * the terms fetch, the two modals' state and the derived display strings —
 * so the view is pure UI.
 *
 * Named for the surface because `useRetailerCard` is the mobile card's hook.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import activate from '../../api/activate'
import fetchTerms from '../../utils/fetchTerms'
import formatCashback from '../../utils/formatCashback'
import injectCashback from '../../utils/injectCashback'
import { getInitials } from '../../utils/getInitials'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useWalletAddress } from '../../hooks/useWalletAddress'

const isBigCashback = (symbol: string, amount: number) => {
    switch (symbol) {
        case "%":
            return amount > 4
        case "$":
            return amount > 10
        default:
            return false
    }
}

/**
 * Long names are truncated to 20 + "..". A search hit shows "name/section"
 * where the section still fits three characters, otherwise the name alone.
 */
const buildOfferName = (
    name: string, label: string, section: string, isSearch: boolean,
) => {
    if (name.length > 22) return name.slice(0, 20) + '..'

    if (isSearch && section) {
        const full = `${name}/${section}`
        if (full.length <= 22) return full
        const availableForSection = 22 - name.length - 1 - 2 // 1 for "/", 2 for ".."
        if (availableForSection >= 3) return `${name}/${section.slice(0, availableForSection)}..`
        return name
    }

    if (isSearch) return name

    return section ? `/${section}` : label
}

interface Args {
    id: string
    name: string
    displayName: string
    section: string
    maxCashback: number
    cashbackSymbol: string
    cashbackCurrency: string
    campaignId?: number
    termsUrl: string
    campaignUrl?: string
    topGeneralTerms: string
    generalTerms: string
    search: ReactSelectOptionType | null
    isDemo: boolean
}

export const useRetailerCardDesktop = ({
    id, name, displayName, section, maxCashback, cashbackSymbol, cashbackCurrency,
    campaignId, termsUrl, campaignUrl, topGeneralTerms, generalTerms, search, isDemo,
}: Args) => {
    const { platform, cryptoSymbols, userId, flowId, iconsPath } = useRouteLoaderData('root') as LoaderData
    const { walletAddress, isTester } = useWalletAddress()
    const { sendAnalyticsEvent } = useAnalytics()
    const [fallbackLogo, setFallbackLogo] = useState('')
    const [redirectLink, setRedirectLink] = useState('')
    const [popupData, setPopupData] = useState<{ iframeUrl?: string, token?: string, domain?: string }>({})
    const [modalState, setModalState] = useState('close')
    const [loginModalState, setLoginModalState] = useState('close')
    // Set when the user hits "connect" from this card's login modal, so the
    // card can re-open itself once the wallet address lands.
    const [reopenAfterConnect, setReopenAfterConnect] = useState(false)
    const [terms, setTerms] = useState('')

    const label = displayName || name
    const cashback = useMemo(() => formatCashback(maxCashback, cashbackSymbol, cashbackCurrency), [cashbackCurrency, cashbackSymbol, maxCashback])
    const isBig = useMemo(() => isBigCashback(cashbackSymbol, maxCashback), [cashbackSymbol, maxCashback])
    const isCampaign = Boolean(campaignId)
    const offerName = useMemo(
        () => buildOfferName(name, label, section, Boolean(search)),
        [name, label, section, search],
    )

    const activateDeal = async () => {
        if (!walletAddress) return

        const body: Parameters<typeof activate>[0] = {
            platform,
            itemId: id,
            walletAddress,
            userId,
            flowId,
            tokenSymbol: cryptoSymbols[0]
        }

        if (search?.value) body['search'] = search.value

        if (isTester && isDemo) body.isDemo = true

        const res = await activate(body)
        setPopupData({
            iframeUrl: res.iframeUrl,
            token: res.token,
            domain: res.domain
        })
        setRedirectLink(res.url)
        setModalState('open')
    }

    const handleClick = () => {
        if (!walletAddress) {
            setLoginModalState('open')
            return
        }
        activateDeal()
        setModalState('loading')
        sendAnalyticsEvent('retailer_open', {
            category: 'user_action',
            action: 'click',
            details: label,
            process: 'activate'
        })
    }

    useEffect(() => {
        if (!reopenAfterConnect || !walletAddress) return
        setReopenAfterConnect(false)
        handleClick()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reopenAfterConnect, walletAddress])

    useEffect(() => {
        if (!termsUrl || terms.length || modalState === 'close') return

        const fetches = [fetchTerms(termsUrl)]
        if (campaignUrl) fetches.push(fetchTerms(campaignUrl))

        Promise.all(fetches)
            .then(([retailerTerms, campaignTerms]) => {
                setTerms(injectCashback(campaignTerms || topGeneralTerms + retailerTerms + generalTerms, cashback))
            })
            .catch(console.error)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalState])

    return {
        iconsPath,
        label,
        cashback,
        offerName,
        isBig,
        isCampaign,
        fallbackLogo,
        useFallbackLogo: () => setFallbackLogo(getInitials(label)),
        handleClick,
        terms,
        redirectLink,
        popupData,
        modalOpen: modalState !== 'close',
        closeModal: () => {
            setModalState('close')
            sendAnalyticsEvent('popup_close', {
                category: 'user_action',
                action: 'click',
                details: 'Retailer',
            })
        },
        loginOpen: loginModalState !== 'close',
        onConnect: () => setReopenAfterConnect(true),
        closeLogin: () => setLoginModalState('close'),
    }
}
