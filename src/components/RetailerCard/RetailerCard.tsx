/**
 * One retailer tile in the grid: logo, name and cashback rate, opening the
 * terms modal on click. Pure UI — logic in useRetailerCardDesktop.
 */
import styles from './styles.module.css'
import RetailerCardModal from '../Modals/RetailerCardModal/RetailerCardModal'
import LoginModal from '../Modals/LoginModal/LoginModal'
import { useRetailerCardDesktop } from './useRetailerCardDesktop'

interface Props extends Retailer {
    topGeneralTerms: string
    campaignUrl?: string
    generalTerms: string
    termsUrl: string
    search: ReactSelectOptionType | null
    isDemo: boolean
}

const RetailerCard = ({
    id,
    iconPath,
    name,
    displayName,
    section,
    backgroundColor,
    maxCashback,
    cashbackSymbol,
    cashbackCurrency,
    termsUrl,
    campaignUrl,
    topGeneralTerms,
    generalTerms,
    search,
    isDemo,
    campaignId
}: Props) => {
    const {
        iconsPath,
        label,
        cashback,
        offerName,
        isBig,
        isCampaign,
        fallbackLogo,
        useFallbackLogo,
        handleClick,
        terms,
        redirectLink,
        popupData,
        modalOpen,
        closeModal,
        loginOpen,
        onConnect,
        closeLogin,
    } = useRetailerCardDesktop({
        id, name, displayName, section, maxCashback, cashbackSymbol, cashbackCurrency,
        campaignId, termsUrl, campaignUrl, topGeneralTerms, generalTerms, search, isDemo,
    })

    return (
        <>
            <div
                id={`retailer-card-${name}`}
                className={styles.card}
                style={isCampaign ? { background: `url(${iconsPath}/campaign-card-background.png) lightgray 50% / cover no-repeat` } : {}}
                onClick={handleClick}
            >
                {isBig || isCampaign ? <div className={`${styles.flag} ${isCampaign ? styles.flag_campaign : ''}`}>{cashback}</div> : null}
                <div
                    id={`retailer-logo-container-${name}`}
                    className={`${fallbackLogo ? styles.fallback_logo_container : styles.logo_container} ${isCampaign ? styles.logo_container_campaign : ''}`}
                    style={!fallbackLogo ? { backgroundColor: backgroundColor || 'white' } : undefined}
                >
                    {fallbackLogo ?
                        <div className={`${styles.fallback_logo} ${fallbackLogo.length === 2 ? styles.fallback_logo_two_letters : ''}`}>{fallbackLogo}</div>
                        :
                        <img
                            id={`retailer-logo-${name}`}
                            className={styles.logo}
                            loading='eager'
                            src={iconPath}
                            alt={`${label} logo`}
                            onError={useFallbackLogo}
                        />
                    }
                </div>
                <div id={`retailer-name-${name}`} className={styles.retailer_name}>{offerName}</div>
                <div id={`retailer-cashback-rate-${name}`} className={`${styles.cashback_rate} ${isCampaign ? styles.cashback_rate_campaign : ''}`}>{isCampaign ? '' : 'Up to '}{cashback} cashback</div>
            </div>
            <RetailerCardModal
                open={modalOpen}
                closeFn={closeModal}
                {...(!fallbackLogo && { backgroundColor })}
                iconPath={iconPath}
                name={label}
                cashback={cashback}
                terms={terms}
                redirectLink={redirectLink}
                fallbackLogo={fallbackLogo}
                {...popupData}
            />
            <LoginModal
                open={loginOpen}
                onConnect={onConnect}
                closeFn={closeLogin}
            />
        </>
    )
}

export default RetailerCard
