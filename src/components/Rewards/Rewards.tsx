/**
 * Desktop dashboard balance block: Pending and Claimable cards, each shedding
 * its badge then its button as it narrows, plus the link to the full ledger.
 * Pure UI — logic in useRewardsDesktop.
 */
import styles from './styles.module.css'
import { Oval } from 'react-loader-spinner'
import LoginModal from '../Modals/LoginModal/LoginModal'
import { useRewardsDesktop } from './useRewardsDesktop'

const Rewards = () => {
    const {
        isAutoClaim,
        claim,
        claimDisabled,
        loading,
        pendingCard,
        claimableCard,
        currentCryptoSymbol,
        pendingTokenAmount,
        pendingTotalEstimatedUsd,
        eligibleTokenAmount,
        eligibleTotalEstimatedUsd,
        cardAction,
        openHistory,
        tooltipAt,
        showTooltip,
        tooltipHandlers,
        loginOpen,
        closeLogin,
        labels,
    } = useRewardsDesktop()

    return (
        <>
            <div
                ref={pendingCard.ref}
                className={styles.card}
                {...cardAction(!pendingCard.fit.action, () => openHistory(true))}
            >
                <div className={styles.left_cluster}>
                    <div className={styles.values}>
                        <div className={styles.card_label}>{labels.pending}</div>
                        <div ref={pendingCard.amountRef} className={styles.amount_row}>
                            <span>{pendingTokenAmount}</span>
                            <span>{currentCryptoSymbol}</span>
                        </div>
                    </div>
                    {pendingCard.fit.badge ? (
                        <div ref={pendingCard.badgeRef} className={styles.badge}>{pendingTotalEstimatedUsd}</div>
                    ) : null}
                </div>
                {pendingCard.fit.action ? (
                    <button
                        id="rewards-view-btn"
                        className={`${styles.card_btn} ${styles.card_btn_details}`}
                        onClick={() => openHistory(true)}
                    >
                        {labels.details}
                    </button>
                ) : null}
            </div>
            {!isAutoClaim ?
                <div
                    ref={claimableCard.ref}
                    className={`${styles.card} ${claimDisabled ? styles.card_disabled : ''}`}
                    {...cardAction(!claimableCard.fit.action, claim, claimDisabled)}
                    {...tooltipHandlers}
                >
                    <div className={styles.left_cluster}>
                        <div className={styles.values}>
                            <div className={styles.card_label}>{labels.claimable}</div>
                            <div ref={claimableCard.amountRef} className={styles.amount_row}>
                                <span>{eligibleTokenAmount}</span>
                                <span>{currentCryptoSymbol}</span>
                            </div>
                        </div>
                        {claimableCard.fit.badge ? (
                            <div ref={claimableCard.badgeRef} className={styles.badge}>{eligibleTotalEstimatedUsd}</div>
                        ) : null}
                    </div>
                    {claimableCard.fit.action ? (
                    <button
                        id="rewards-claim-btn"
                        className={`${styles.card_btn} ${styles.card_btn_claim}`}
                        onClick={claim}
                        disabled={claimDisabled}
                    >
                        {loading ?
                            // Oval writes `color` straight into the SVG `stroke`
                            // attribute, where a var() never resolves — so the
                            // theme drives it through the wrapper's `color`.
                            <span className={styles.loader}>
                                <Oval
                                    visible={true}
                                    height="20"
                                    width="20"
                                    color="currentColor"
                                    secondaryColor='grey'
                                    strokeWidth={6}
                                    ariaLabel="oval-loading"
                                />
                            </span>
                            : labels.claim}
                    </button>
                    ) : null}
                </div>
                : null}
            <button
                id="rewards-history-btn"
                className={styles.history_card}
                onClick={() => openHistory()}
            >
                {labels.historyCard}
            </button>
            {showTooltip && tooltipAt && (
                <div
                    role="tooltip"
                    className={styles.tooltip}
                    style={{ left: tooltipAt.left, top: tooltipAt.top }}
                >
                    {labels.minimumClaim}
                </div>
            )}
            <LoginModal closeFn={closeLogin} open={loginOpen} />
        </>
    )
}

export default Rewards
