/**
 * The retailer grid, or a full screen of placeholders while it loads.
 * Pure UI — logic in useCardsListDesktop.
 */
import styles from './styles.module.css'
import RetailerCard from '../RetailerCard/RetailerCard'
import RetailerCardSkeleton from '../RetailerCard/RetailerCardSkeleton'
import { useCardsListDesktop } from './useCardsListDesktop'

interface Metadata {
    iconQueryParam: string
    generalTermsUrl: string
    topGeneralTermsUrl: string
    retailerIconBasePath: string
    retailerTermsBasePath: string
}

interface Props {
    retailers: Retailer[]
    metadata: Metadata | undefined
    loading: boolean
    search: ReactSelectOptionType | null
    isDemo: boolean
}

const CardsList = ({ retailers, metadata, loading, search, isDemo }: Props) => {
    const { generalTerms, topGeneralTerms, showSkeleton } = useCardsListDesktop({
        generalTermsUrl: metadata?.generalTermsUrl,
        topGeneralTermsUrl: metadata?.topGeneralTermsUrl,
        loading,
        hasMetadata: Boolean(metadata),
    })

    if (showSkeleton || !metadata) {
        return (
            <div className={styles.container}>
                {Array.from({ length: 25 }, (_, i) => (
                    <RetailerCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    return (
        <div id="cards-list" className={styles.container}>
            {retailers.map(retailer =>
                <RetailerCard
                    key={retailer.id}
                    {...retailer}
                    {...metadata}
                    isDemo={isDemo}
                    search={search}
                    topGeneralTerms={topGeneralTerms}
                    generalTerms={generalTerms}
                    campaignUrl={retailer.campaignPath ? `${metadata.retailerTermsBasePath}${retailer.campaignPath}` : undefined}
                    termsUrl={`${metadata.retailerTermsBasePath}${retailer.termsPath}`}
                    iconPath={`${metadata.retailerIconBasePath}${retailer.iconPath}${metadata.iconQueryParam}`}
                />
            )}
        </div>
    )
}

export default CardsList
