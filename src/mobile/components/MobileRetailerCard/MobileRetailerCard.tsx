/**
 * Retailer card: logo, name + cashback rate, Shop pill. Tap runs onClick
 * (activate flow). Logo failure falls back to initials.
 */
import { useMemo, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import formatCashback from '../../../utils/formatCashback'
import { getInitials } from '../../../utils/getInitials'
import Icon from '../../../components/Icon/Icon'
import { useTranslation } from 'react-i18next'
import styles from './styles.module.css'

interface Props {
    retailer: Retailer
    iconPath: string
    onClick: (retailer: Retailer) => void
}

const MobileRetailerCard = ({ retailer, iconPath, onClick }: Props) => {
    const { cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()
    const [fallbackLogo, setFallbackLogo] = useState('')

    const cashback = useMemo(
        () => formatCashback(retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency),
        [retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency],
    )

    const tokenSymbol = cryptoSymbols?.[0] ?? ''

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
                            onError={() => setFallbackLogo(getInitials(retailer.displayName))}
                        />
                    )}
                </div>
                <div className={styles.text}>
                    <span className={styles.name}>{retailer.displayName}</span>
                    <span className={styles.sub}>
                        <span className={styles.sub_label}>{t('upTo')} </span>
                        <span className={styles.sub_amount}>{cashback}</span>
                        <span className={styles.sub_label}> {t('in')} </span>
                        <span className={styles.sub_coin}>{tokenSymbol}</span>
                    </span>
                </div>
            </div>
            <span className={styles.shop} aria-hidden="true">
                <span className={styles.shop_label}>{t('shop')}</span>
                <Icon name="external-link.svg" alt="" />
            </span>
        </button>
    )
}

export default MobileRetailerCard
