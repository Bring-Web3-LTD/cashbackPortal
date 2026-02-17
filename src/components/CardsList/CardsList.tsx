import styles from './styles.module.css'
import RetailerCard from '../RetailerCard/RetailerCard'
import RetailerCardSkeleton from '../RetailerCard/RetailerCardSkeleton'
import { useEffect, useState } from 'react'
import fetchTerms from '../../utils/fetchTerms'

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
    const [generalTerms, setGeneralTerms] = useState('')
    const [topGeneralTerms, setTopGeneralTerms] = useState('')

    useEffect(() => {
        if (!metadata?.generalTermsUrl || !metadata?.topGeneralTermsUrl) return
        if (generalTerms && topGeneralTerms) return

        const controller = new AbortController()

        Promise.all([
            fetchTerms(metadata.topGeneralTermsUrl),
            fetchTerms(metadata.generalTermsUrl)
        ])
            .then(([topTerms, terms]) => {
                if (!controller.signal.aborted) {
                    setTopGeneralTerms(topTerms)
                    setGeneralTerms(terms)
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    console.error('Failed to fetch terms:', error)
                }
            })
        return () => controller.abort()
    }, [metadata?.generalTermsUrl, metadata?.topGeneralTermsUrl, generalTerms, topGeneralTerms])

    if (loading || !metadata) {
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