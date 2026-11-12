/**
 * Desktop dashboard balance block: Pending and Claimable cards, each shedding
 * its $ badge, then its asset name, then its button as it narrows, plus the
 * link to the full ledger. Pure UI — logic in useRewardsDesktop.
 */
import styles from './styles.module.css'
import { Oval } from 'react-loader-spinner'
import LoginModal from '../Modals/LoginModal/LoginModal'
import { useRewardsDesktop } from './useRewardsDesktop'

type CardFit = ReturnType<typeof useRewardsDesktop>['pendingCard']
type CardValues = ReturnType<typeof useRewardsDesktop>['pendingValues']

/** Label over the asset row: name, token amount, $ badge on one baseline. */
const Values = ({ card, label, values }: { card: CardFit; label: string; values: CardValues }) => (
    <div className={styles.values}>
        <div className={styles.card_label}>{label}</div>
        <div className={styles.asset_row}>
            {card.fit.name && values.name ? (
                <span ref={card.nameRef} className={styles.asset_name}>{values.name}</span>
            ) : null}
            <span ref={card.amountRef} className={styles.amount}>
                {values.amount} {values.symbol}
            </span>
            {card.fit.badge ? (
                <span ref={card.badgeRef} className={styles.badge}>{values.usd}</span>
            ) : null}
        </div>
    </div>
)

const Rewards = () => {
    const {
        isAutoClaim,
        claim,
        claimDisabled,
        loading,
        pendingCard,
        claimableCard,
        pendingValues,
        claimableValues,
        claimBtnRef,
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
                <Values card={pendingCard} label={labels.pending} values={pendingValues} />
                {pendingCard.fit.action ? (
                    <button
                        id="rewards-view-btn"
                        ref={pendingCard.actionRef}
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
                    <Values card={claimableCard} label={labels.claimable} values={claimableValues} />
                    {claimableCard.fit.action ? (
                    <button
                        id="rewards-claim-btn"
                        ref={claimBtnRef}
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
                                    height="12"
                                    width="12"
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
