/**
 * Logic hook for the MobileHome page. Owns the category/search/claim state,
 * the claim flow (initiate → SIGN_MESSAGE → submit) and the SESSION message
 * listener, and derives the autocomplete suggestions so the page .tsx is pure
 * UI (it only decides which filter-row variant to render).
 */
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouteLoaderData } from 'react-router-dom'
import { CategoriesItem } from '../../components/Categories/Categories.mobile'
import { useCategories, selectCategories, selectSearchTerms } from '../../hooks/useCategories'
import { useRetailers, selectRetailers, selectRetailersMetadata } from '../../hooks/useRetailers'
import { useBalance, selectEligible } from '../../hooks/useBalance'
import { useWalletAddress } from '../../utils/hooks/useWalletAddress'
import message from '../../utils/message'
import claimInitiate from '../../api/claim/initiate'
import claimSubmit from '../../api/claim/submit'
import { MobileClaimModalState } from '../../utils/claimFlow'
import { DEV_MODE } from '../../config'

// Min chars before the autocomplete filters/shows — a single char matches
// too much to be useful.
const SEARCH_MIN_CHARS = 2

export const useHomePage = () => {
    const { platform, userId, flowId, cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { walletAddress, walletName, walletEmoji } = useWalletAddress()
    const queryClient = useQueryClient()

    const [category, setCategory] = useState<CategoriesItem | null>(null)
    const [searchOpen, setSearchOpen] = useState(false)
    // Text currently typed in the input — drives the autocomplete dropdown only.
    const [searchTyping, setSearchTyping] = useState('')
    // Committed search value — drives the API filter and the chip display.
    const [searchChip, setSearchChip] = useState<string | null>(null)
    const [claimState, setClaimState] = useState<MobileClaimModalState | null>(() => {
        // DEV ONLY: force a claim modal state via ?claimState=failure|success|processing|minimum|confirm
        if (DEV_MODE) {
            const forced = new URLSearchParams(window.location.search).get('claimState')
            const valid = ['confirm', 'processing', 'success', 'failure', 'minimum']
            if (forced && valid.includes(forced)) return forced as MobileClaimModalState
        }
        return null
    })
    const [claimExplorerLink, setClaimExplorerLink] = useState<string | null>(null)
    const claimExplorerLinkRef = useRef(claimExplorerLink)
    useEffect(() => { claimExplorerLinkRef.current = claimExplorerLink }, [claimExplorerLink])

    const { data: filters, isLoading: isLoadingCategories } = useCategories()
    const categories = selectCategories(filters)
    const searchTerms = selectSearchTerms(filters)
    const { data: balance } = useBalance()
    const eligible = selectEligible(balance)
    const currentCryptoSymbol = eligible?.tokenSymbol ?? cryptoSymbols?.[0] ?? ''
    const claimAmount = eligible?.tokenAmount ?? 0
    const minimumClaimThreshold = eligible?.minimumClaimThreshold ?? 0
    const claimDisplay = eligible?.tokenAmountDisplay ?? '0.00'

    // Only the committed chip filters the API. The typed query
    // drives the autocomplete dropdown via local filtering of the already-
    // loaded retailer list — so typing "ali" instantly surfaces "AliExpress",
    // "Alibaba.com", etc. without a server round-trip.
    const trimmedTyping = searchTyping.trim()
    const search: ReactSelectOptionType | null = searchChip
        ? { value: searchChip, label: searchChip }
        : null

    const {
        data: retailersData,
        isLoading: isLoadingRetailers,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useRetailers({ category, search })
    const retailers = selectRetailers(retailersData)
    const metadata = selectRetailersMetadata(retailersData)

    const needle = trimmedTyping.toLowerCase()
    const hasMinChars = trimmedTyping.length >= SEARCH_MIN_CHARS
    const suggestions = (searchOpen && hasMinChars)
        ? searchTerms
            .filter(t => {
                const l = t.toLowerCase()
                return l.startsWith(needle) || l.split(/\s+/).some(w => w.startsWith(needle))
            })
            .map(t => ({ id: t, name: t }))
        : []

    const showDropdown = searchOpen && hasMinChars
    const showNoResults =
        showDropdown && !isLoadingCategories && searchTerms.length > 0 && suggestions.length === 0

    const handleCloseSearch = () => {
        setSearchTyping('')
        setSearchOpen(false)
    }

    const handleSelectSuggestion = (name: string) => {
        setSearchChip(name)
        setSearchTyping('')
        setSearchOpen(false)
    }

    const handleClearSearchChip = () => {
        setSearchChip(null)
    }

    const handleOpenClaim = () => {
        if (!eligible || claimAmount <= 0) return
        if (claimAmount < minimumClaimThreshold) {
            setClaimState('minimum')
            return
        }
        setClaimState('confirm')
    }

    const handleCloseClaim = () => {
        setClaimState(null)
        setClaimExplorerLink(null)
    }

    const handleConfirmClaim = async () => {
        if (!walletAddress || !eligible) return
        setClaimState('processing')

        const initiated = await claimInitiate({
            platform,
            walletAddress,
            targetWalletAddress: walletAddress,
            tokenSymbol: currentCryptoSymbol,
            tokenAmount: claimAmount,
            userId,
            flowId,
        })

        setClaimExplorerLink(initiated?.explorerLink ?? null)

        if (!initiated?.messageToSign) {
            setClaimState('failure')
            return
        }

        message({
            messageToSign: initiated.messageToSign,
            amount: claimAmount,
            action: 'SIGN_MESSAGE',
            tokenSymbol: currentCryptoSymbol,
        })
    }

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.to !== 'bringweb3' || event.origin === window.location.origin) return

            if (event.data.action === 'ABORT_SIGN_MESSAGE') {
                setClaimState('confirm')
                return
            }

            if (event.data.action !== 'SIGNATURE') return
            if (!walletAddress || !eligible) {
                setClaimState('failure')
                return
            }

            const body: Parameters<typeof claimSubmit>[0] = {
                walletAddress,
                targetWalletAddress: walletAddress,
                tokenSymbol: currentCryptoSymbol,
                tokenAmount: claimAmount,
                signature: event.data.signature,
                message: event.data.message,
                platform,
                userId,
                flowId,
            }
            if (event.data.key) body.key = event.data.key

            const submitted = await claimSubmit(body)

            if (submitted?.ok) {
                setClaimExplorerLink(submitted.explorerLink ?? claimExplorerLinkRef.current)
                setClaimState('success')
                queryClient.invalidateQueries({ queryKey: ['balance', walletAddress] })
                return
            }

            setClaimExplorerLink(submitted?.explorerLink ?? claimExplorerLinkRef.current)
            setClaimState('failure')
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [
        claimAmount,
        currentCryptoSymbol,
        eligible,
        flowId,
        platform,
        queryClient,
        userId,
        walletAddress,
    ])

    return {
        // filter row
        category,
        setCategory,
        searchOpen,
        setSearchOpen,
        searchTyping,
        setSearchTyping,
        searchChip,
        suggestions,
        showDropdown,
        showNoResults,
        handleCloseSearch,
        handleSelectSuggestion,
        handleClearSearchChip,
        categories,
        isLoadingCategories,
        // cards
        retailers,
        metadata,
        isLoadingRetailers,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        // claim
        claimState,
        currentCryptoSymbol,
        claimDisplay,
        claimAmount,
        minimumClaimThreshold,
        walletAddress,
        walletName,
        walletEmoji,
        claimExplorerLink,
        handleOpenClaim,
        handleCloseClaim,
        handleConfirmClaim,
    }
}
