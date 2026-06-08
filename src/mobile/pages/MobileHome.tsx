import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import MobileHeroSection from '../components/MobileHeroSection/MobileHeroSection'
import MobileCategories, { MobileCategoriesItem } from '../components/MobileCategories/MobileCategories'
import MobileSearchBar from '../components/MobileSearchBar/MobileSearchBar'
import MobileFilterChip from '../components/MobileFilterChip/MobileFilterChip'
import MobileCardsList from '../components/MobileCardsList/MobileCardsList'
import MobileClaimModal from '../components/MobileClaimModal/MobileClaimModal'
import { useCategories, selectCategories } from '../hooks/useCategories'
import { useRetailers, selectRetailers, selectRetailersMetadata } from '../hooks/useRetailers'
import { useBalance, selectEligible } from '../hooks/useBalance'
import { computeSuggestions } from '../../utils/computeSuggestions'
import { useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from '../../utils/hooks/useWalletAddress'
import message from '../../utils/message'
import claimInitiate from '../../api/claim/initiate'
import claimSubmit from '../../api/claim/submit'
import { MobileClaimModalState } from '../utils/claimFlow'
import { DEV_MODE } from '../../config'
import styles from './MobileHome.module.css'

const MobileHome = () => {
    const { platform, userId, flowId, cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { walletAddress, walletName, walletEmoji } = useWalletAddress()
    const queryClient = useQueryClient()

    const [category, setCategory] = useState<MobileCategoriesItem | null>(null)
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

    const { data: filters, isLoading: isLoadingCategories } = useCategories()
    const categories = selectCategories(filters)
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

    // Autocomplete suggestions: two-pass local filter — first names that
    // start with the query, then word-boundary matches (so "express" still
    // surfaces "AliExpress"). De-duped, case-insensitive.
    const suggestions = computeSuggestions(retailers, searchOpen ? trimmedTyping : '')

    const showDropdown = searchOpen && trimmedTyping.length > 0
    // Only show the empty state once retailers have loaded AND no local match
    // was found — otherwise we'd flash "No matches" before the list arrives.
    const showNoResults =
        showDropdown && !isLoadingRetailers && retailers.length > 0 && suggestions.length === 0

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

            if (submitted?.status === 202) {
                setClaimExplorerLink(submitted.explorerLink ?? claimExplorerLink)
                setClaimState('success')
                queryClient.invalidateQueries({ queryKey: ['balance', walletAddress] })
                return
            }

            setClaimExplorerLink(submitted?.explorerLink ?? claimExplorerLink)
            setClaimState('failure')
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [
        claimAmount,
        claimExplorerLink,
        currentCryptoSymbol,
        eligible,
        flowId,
        platform,
        queryClient,
        userId,
        walletAddress,
    ])

    // Decide what occupies the tabs-row slot. Priority: open input >
    // committed search chip > category chip > full categories row.
    const renderFilterRow = () => {
        if (searchOpen) {
            return (
                <MobileSearchBar
                    value={searchTyping}
                    onChange={setSearchTyping}
                    onClose={handleCloseSearch}
                    suggestions={suggestions}
                    onSelectSuggestion={handleSelectSuggestion}
                    showDropdown={showDropdown}
                    showNoResults={showNoResults}
                />
            )
        }
        if (searchChip) {
            return <MobileFilterChip label={searchChip} onClear={handleClearSearchChip} />
        }
        if (category) {
            return <MobileFilterChip label={category.name} onClear={() => setCategory(null)} />
        }
        return (
            <MobileCategories
                categories={categories}
                selectedId={null}
                isLoading={isLoadingCategories}
                onSelect={setCategory}
                onSearchClick={() => setSearchOpen(true)}
            />
        )
    }

    return (
        <div className={styles.root} data-testid="mobile-home">
            <main className={styles.content}>
                <MobileHeroSection onClaim={handleOpenClaim} />
                {renderFilterRow()}
                <MobileCardsList
                    retailers={retailers}
                    metadata={metadata}
                    isLoading={isLoadingRetailers}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={Boolean(hasNextPage)}
                    onFetchNextPage={fetchNextPage}
                />
            </main>
            <MobileClaimModal
                state={claimState}
                tokenSymbol={currentCryptoSymbol}
                tokenAmountDisplay={claimDisplay}
                tokenAmount={claimAmount}
                minimumClaimThreshold={minimumClaimThreshold}
                walletAddress={walletAddress}
                walletName={walletName}
                walletEmoji={walletEmoji}
                explorerLink={claimExplorerLink}
                onClose={handleCloseClaim}
                onConfirm={handleConfirmClaim}
                onTryAgain={handleConfirmClaim}
                onDevSetState={setClaimState}
            />
        </div>
    )
}

export default MobileHome
