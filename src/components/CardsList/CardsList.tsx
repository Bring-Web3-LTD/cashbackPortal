import styles from './styles.module.css'
import RetailerCard from '../RetailerCard/RetailerCard'
import RetailerCardSkeleton from '../RetailerCard/RetailerCardSkeleton'

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
}

const CardsList = ({ retailers, metadata, loading }: Props) => {

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
                    iconPath={`${metadata.retailerIconBasePath}${retailer.iconPath}${metadata.iconQueryParam}`}
                />
            )}
        </div>
    )
}

export default CardsList