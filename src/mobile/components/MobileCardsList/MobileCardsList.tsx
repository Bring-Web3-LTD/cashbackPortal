/** Mobile retailer list + infinite scroll. Owns the T&C modal flow: tap card → fetch terms + pre-activate() the redirect URL → "Go to shop" anchor opens a top-level new tab (the affiliate URL forbids framing). */
import { useEffect, useRef, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import MobileRetailerCard from '../MobileRetailerCard/MobileRetailerCard'
import MobileRetailerCardModal from '../MobileRetailerCardModal/MobileRetailerCardModal'
import activate from '../../../api/activate'
import fetchTerms from '../../../utils/fetchTerms'
import { useWalletAddress } from '../../../utils/hooks/useWalletAddress'
import { useGoogleAnalytics } from '../../../utils/hooks/useGoogleAnalytics'
import type { RetailersMetadata } from '../../hooks/useRetailers'
import styles from './styles.module.css'

interface Props {
    retailers: Retailer[]
    metadata: RetailersMetadata | undefined
    isLoading: boolean
    isFetchingNextPage: boolean
    hasNextPage: boolean
    onFetchNextPage: () => void
}

const SKELETON_ROWS = 8

const MobileCardsList = ({
    retailers,
    metadata,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    onFetchNextPage,
}: Props) => {
    const { platform, cryptoSymbols, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { sendGaEvent } = useGoogleAnalytics()

    const sentinelRef = useRef<HTMLDivElement>(null)

    // Cached general + topGeneral terms. Fetched once per metadata change so
    // each retailer modal only has to fetch its own retailer-specific terms.
    const [generalTerms, setGeneralTerms] = useState('')
    const [topGeneralTerms, setTopGeneralTerms] = useState('')

    // Modal state.
    const [activeRetailer, setActiveRetailer] = useState<Retailer | null>(null)
    const [activeTerms, setActiveTerms] = useState('')
    // Retailer redirect URL, pre-fetched via activate() when the modal opens.
    const [redirectLink, setRedirectLink] = useState('')

    // ── Infinite scroll ───────────────────────────────────────────────
    // Observe the sentinel against its own scroll container (.list) and start
    // fetching the next page a large margin (1500px ≈ ~20 cards) before the
    // bottom, so a new batch is ready well before the user scrolls to it.
    useEffect(() => {
        const node = sentinelRef.current
        if (!node || !hasNextPage) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) {
                    onFetchNextPage()
                }
            },
            { root: node.parentElement, rootMargin: '1500px 0px' },
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, onFetchNextPage, retailers.length])

    // ── Prefetch general + topGeneral terms ───────────────────────────
    useEffect(() => {
        if (!metadata?.generalTermsUrl || !metadata?.topGeneralTermsUrl) return
        if (generalTerms && topGeneralTerms) return

        const controller = new AbortController()
        Promise.all([
            fetchTerms(metadata.topGeneralTermsUrl),
            fetchTerms(metadata.generalTermsUrl),
        ])
            .then(([top, general]) => {
                if (controller.signal.aborted) return
                setTopGeneralTerms(top)
                setGeneralTerms(general)
            })
            .catch((err) => {
                if (!controller.signal.aborted) console.error('Failed to fetch general terms', err)
            })
        return () => controller.abort()
    }, [metadata?.generalTermsUrl, metadata?.topGeneralTermsUrl, generalTerms, topGeneralTerms])

    // ── Fetch retailer-specific terms whenever a modal opens ──────────
    useEffect(() => {
        if (!activeRetailer || !metadata?.retailerTermsBasePath) return

        const controller = new AbortController()
        const termsUrl = `${metadata.retailerTermsBasePath}${activeRetailer.termsPath}`
        const campaignUrl = activeRetailer.campaignPath
            ? `${metadata.retailerTermsBasePath}${activeRetailer.campaignPath}`
            : undefined

        const fetches = [fetchTerms(termsUrl)]
        if (campaignUrl) fetches.push(fetchTerms(campaignUrl))

        Promise.all(fetches)
            .then(([retailerTerms, campaignTerms]) => {
                if (controller.signal.aborted) return
                setActiveTerms(campaignTerms || topGeneralTerms + retailerTerms + generalTerms)
            })
            .catch((err) => {
                if (!controller.signal.aborted) console.error('Failed to fetch retailer terms', err)
            })

        return () => controller.abort()
    }, [activeRetailer, metadata?.retailerTermsBasePath, topGeneralTerms, generalTerms])

    // Pre-activate on modal open (needs a wallet) to fetch the redirect URL so "Go to shop" can be a target="_blank" anchor.
    useEffect(() => {
        setRedirectLink('')
        if (!activeRetailer || !walletAddress) return

        let cancelled = false
        activate({
            platform,
            itemId: activeRetailer.id,
            walletAddress,
            userId,
            flowId,
            tokenSymbol: cryptoSymbols[0],
        })
            .then((res) => {
                if (!cancelled && res?.url) setRedirectLink(res.url)
            })
            .catch((err) => {
                if (!cancelled) console.error('Failed to activate retailer', err)
            })

        return () => {
            cancelled = true
        }
    }, [activeRetailer, walletAddress, platform, userId, flowId, cryptoSymbols])

    // ── Handlers ──────────────────────────────────────────────────────
    const handleCardClick = (retailer: Retailer) => {
        sendGaEvent('retailer_open', {
            category: 'user_action',
            action: 'click',
            details: retailer.name,
            process: 'view_terms',
        })
        setActiveTerms('')
        setActiveRetailer(retailer)
    }

    const handleCancel = () => {
        setActiveRetailer(null)
        setActiveTerms('')
        setRedirectLink('')
    }

    // The anchor opens the new tab; here we only log GA and close the modal.
    const handleGoToShop = () => {
        if (!activeRetailer) return
        sendGaEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: activeRetailer.name,
        })
        setActiveRetailer(null)
        setActiveTerms('')
        setRedirectLink('')
    }

    if (isLoading || !metadata) {
        return (
            <div className={styles.listWrap}>
                <div className={styles.list}>
                    {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                        <div key={i} className={styles.skeleton_card} aria-hidden="true">
                            <div className={styles.skeleton_left}>
                                <div className={styles.skeleton_logo} />
                                <div className={styles.skeleton_text}>
                                    <div className={`${styles.skeleton_bar} ${styles.skeleton_bar_short}`} />
                                    <div className={`${styles.skeleton_bar} ${styles.skeleton_bar_long}`} />
                                </div>
                            </div>
                            <div className={styles.skeleton_shop} />
                        </div>
                    ))}
                </div>
                <span className={styles.bottomFog} aria-hidden="true" />
            </div>
        )
    }

    const activeIconPath = activeRetailer
        ? `${metadata.retailerIconBasePath}${activeRetailer.iconPath}${metadata.iconQueryParam}`
        : ''

    return (
        <>
            <div className={styles.listWrap}>
                <div className={styles.list}>
                    {retailers.map((retailer) => (
                        <MobileRetailerCard
                            key={retailer.id}
                            retailer={retailer}
                            iconPath={`${metadata.retailerIconBasePath}${retailer.iconPath}${metadata.iconQueryParam}`}
                            onClick={handleCardClick}
                        />
                    ))}
                    {hasNextPage ? <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" /> : null}
                </div>
                <span className={styles.bottomFog} aria-hidden="true" />
            </div>
            <MobileRetailerCardModal
                open={activeRetailer !== null}
                retailer={activeRetailer}
                iconPath={activeIconPath}
                terms={activeTerms}
                redirectLink={redirectLink}
                onCancel={handleCancel}
                onGoToShop={handleGoToShop}
            />
        </>
    )
}

export default MobileCardsList
