import styles from './styles.module.css'
import RetailerCard from '../RetailerCard/RetailerCard'

interface Metadata {
    iconQueryParam: string
    generalTermsUrl: string
    retailerIconBasePath: string
    retailerTermsBasePath: string
}

interface Props {
    retailers: Retailer[]
    metadata: Metadata | undefined
}

const CardsList = ({ retailers, metadata }: Props) => {

    if (!metadata) {
        return <></>
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