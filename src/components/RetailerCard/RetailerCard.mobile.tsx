/**
 * Retailer card: logo, name + cashback rate, Shop pill. Tap runs onClick
 * (activate flow). Logo failure falls back to initials. Pure UI — logic in
 * useRetailerCard.
 */
import Icon from '../Icon/Icon'
import { useRetailerCard, RetailerCardProps } from './useRetailerCard'
import styles from './styles.mobile.module.css'

const RetailerCard = (props: RetailerCardProps) => {
    const { retailer, iconPath, onClick } = props
    const { labels, cashback, tokenSymbol, fallbackLogo, onLogoError } = useRetailerCard(props)

    return (
        <button
            type="button"
            id={`mobile-retailer-card-${retailer.id}`}
            aria-label={retailer.displayName}
            className={styles.card}
            onClick={() => onClick(retailer)}
        >
            <div className={styles.left}>
                <div
                    className={styles.logo}
                    style={!fallbackLogo ? { backgroundColor: retailer.backgroundColor || 'white' } : undefined}
                >
                    {fallbackLogo ? (
                        <span
                            className={`${styles.fallback} ${fallbackLogo.length === 2 ? styles.fallback_two : ''}`}
                        >
                            {fallbackLogo}
                        </span>
                    ) : (
                        <img
                            className={styles.logo_img}
                            loading="lazy"
                            src={iconPath}
                            alt={`${retailer.displayName} logo`}
                            onError={onLogoError}
                        />
                    )}
                </div>
                <div className={styles.text}>
                    <span className={styles.name}>{retailer.displayName}</span>
                    <span className={styles.sub}>
                        <span className={styles.sub_label}>{labels.upTo} </span>
                        <span className={styles.sub_amount}>{cashback}</span>
                        <span className={styles.sub_label}> {labels.in} </span>
                        <span className={styles.sub_coin}>{tokenSymbol}</span>
                    </span>
                </div>
            </div>
            <span className={styles.shop} aria-hidden="true">
                <span className={styles.shop_label}>{labels.shop}</span>
                <Icon name="external-link.svg" alt="" />
            </span>
        </button>
    )
}

export default RetailerCard
