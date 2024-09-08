import styles from './styles.module.css'
import RetailerCard from '../RetailerCard/RetailerCard'
import RetailerCardSkeleton from '../RetailerCard/RetailerCardSkeleton'
import { useEffect, useState } from 'react'

interface Metadata {
    iconQueryParam: string
    generalTermsUrl: string
    retailerIconBasePath: string
    retailerTermsBasePath: string
}

interface Props {
    retailers: Retailer[]
    metadata: Metadata | undefined
    loading: boolean
    search: ReactSelectOptionType | null
}

const CardsList = ({ retailers, metadata, loading, search }: Props) => {
    const [generalTerms, setGeneralTerms] = useState('')

    useEffect(() => {
        if (!metadata?.generalTermsUrl || generalTerms.length) return

        fetch(metadata.generalTermsUrl)
            .then(res => res.text())
            .then(data => setGeneralTerms(data))
    }, [generalTerms.length, metadata?.generalTermsUrl])

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
        <div className={styles.container}>
            {retailers.map(retailer =>
                <RetailerCard
                    key={retailer.id}
                    {...retailer}
                    {...metadata}
                    search={search}
                    generalTerms={generalTerms}
                    termsUrl={`${metadata.retailerTermsBasePath}${retailer.termsPath}`}
                    iconPath={`${metadata.retailerIconBasePath}${retailer.iconPath}${metadata.iconQueryParam}`}
                />
            )}
        </div>
    )
}

export default CardsList