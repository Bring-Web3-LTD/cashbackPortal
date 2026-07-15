/**
 * History row. Collapsed: logo, name + date, amount pill, status text.
 * Expanded: divider + per-step deal history. Pure UI — logic in
 * useHistoryItem.
 */
import { FC } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from '../Icon/Icon'
import { useHistoryItem, HistoryItemProps } from './useHistoryItem'
import styles from './styles.mobile.module.css'

const HistoryItem: FC<HistoryItemProps> = (props) => {
    const { row, isOpen } = props
    const { panelId, buttonId, imgFailed, fallbackLogo, onImgError, expandable, handleClick } =
        useHistoryItem(props)

    return (
        <div
            className={`${styles.item} ${isOpen ? styles.itemOpen : ''} ${
                expandable ? styles.itemExpandable : ''
            }`}
        >
            <button
                type="button"
                id={buttonId}
                className={styles.row}
                onClick={handleClick}
                aria-expanded={expandable ? isOpen : undefined}
                aria-controls={expandable ? panelId : undefined}
                disabled={!expandable}
            >
                <span
                    className={`${styles.avatar} ${row.isClaim ? styles.avatarClaim : ''} ${fallbackLogo ? styles.avatarHasFallback : ''}`}
                    style={!row.isClaim && !fallbackLogo ? { background: row.iconBg || '#FFFFFF' } : undefined}
                    aria-hidden="true"
                >
                    {row.isClaim ? (
                        <Icon name="gift.svg" className={styles.avatarImg} alt="" />
                    ) : !imgFailed && row.iconSrc ? (
                        <img
                            className={styles.avatarImg}
                            src={row.iconSrc}
                            alt=""
                            onError={onImgError}
                        />
                    ) : (
                        <span
                            className={`${styles.avatarFallback} ${fallbackLogo.length === 2 ? styles.avatarFallbackTwo : ''}`}
                        >
                            {fallbackLogo}
                        </span>
                    )}
                </span>
                <span className={styles.body}>
                    <span className={styles.name}>{row.retailerName}</span>
                    {row.date ? <span className={styles.date}>{row.date}</span> : null}
                </span>
                <span className={styles.right}>
                    <span
                        className={`${styles.amount} ${
                            styles[`amount_${row.rawStatus}`] ?? ''
                        }`}
                    >
                        {row.amountDisplay} {row.tokenSymbol}
                    </span>
                    <span
                        className={`${styles.status} ${
                            styles[`status_${row.rawStatus}`] ?? ''
                        }`}
                    >
                        {row.status}
                    </span>
                </span>
            </button>
            <AnimatePresence initial={false}>
                {expandable && isOpen && (
                    <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className={styles.panel}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <span className={styles.divider} aria-hidden="true" />
                        <div className={styles.panelBody}>
                            {row.description.map((line, i) => {
                                if (!line[0] && !line[1]) return null
                                return (
                                    <p key={i} className={styles.descriptionLine}>
                                        {line[0] ? <span>{line[0]}</span> : null}
                                        {line[0] && line[1] ? ' — ' : null}
                                        {line[1] ? line[1] : null}
                                        {line[2] ? (
                                            <span className={styles.txid}>
                                                TxID: {line[2]}
                                            </span>
                                        ) : null}
                                    </p>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default HistoryItem
