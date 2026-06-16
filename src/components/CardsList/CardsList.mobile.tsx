/** Mobile retailer list + infinite scroll + T&C modal flow. Pure UI — logic
 * in useCardsList. */
import MobileRetailerCard from '../../mobile/components/MobileRetailerCard/MobileRetailerCard'
import MobileRetailerCardModal from '../../mobile/components/MobileRetailerCardModal/MobileRetailerCardModal'
import { useCardsList, CardsListProps } from './useCardsList'
import styles from './styles.mobile.module.css'

const SKELETON_ROWS = 8

const CardsList = (props: CardsListProps) => {
    const { retailers, metadata, isLoading, hasNextPage } = props
    const {
        sentinelRef,
        activeRetailer,
        activeTerms,
        redirectLink,
        activeIconPath,
        handleCardClick,
        handleCancel,
        handleGoToShop,
    } = useCardsList(props)

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

export default CardsList
