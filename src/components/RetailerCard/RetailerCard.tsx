import styles from './styles.module.css'
import formatCashback from '../../utils/formatCashback'
import { useState } from 'react'

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

interface Props extends Retailer {
    generalTermsUrl: string
    retailerTermsBasePath: string
    // searchTerm: ReactSelectOptionType | null
}

const RetailerCard = ({
    // id,
    iconPath,
    name,
    section,
    backgroundColor,
    maxCashback,
    cashbackSymbol,
    cashbackCurrency,
    // termsPath,
    // generalTermsUrl,
    // retailerTermsBasePath,
    // searchTerm,
}: Props) => {
    const [fallbackImg, setFallbackImg] = useState('')
    const cashback = formatCashback(maxCashback, cashbackSymbol, cashbackCurrency)
    const isBig = isBigCashback(cashbackSymbol, maxCashback)

    return (
        <div className={styles.card}>
            {isBig ? <div className={styles.flag}>{cashback}</div> : null}
            <div
                className={styles.logo_container}
                style={{ backgroundColor: backgroundColor || 'white' }}
            >
                {fallbackImg ?
                    <div className={styles.fallback_img}>{fallbackImg}</div>
                    :
                    <img
                        className={styles.logo}
                        loading='eager'
                        src={iconPath}
                        alt={`${name} logo`}
                        onError={() => setFallbackImg(name)}
                    />
                }
            </div>
            <div className={styles.retailer_name}>{section ? `/${section}` : name}</div>
            <div className={styles.cashback_rate}>Up to {cashback} cashback</div>
        </div>
    )
}

export default RetailerCard