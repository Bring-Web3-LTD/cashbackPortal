import styles from './styles.module.css'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Icon from '../../components/Icon/Icon'
import Header from '../../components/Header/Header'
import Dashboard from '../../components/Dashboard/Dashboard'
import { getInitials } from '../../utils/getInitials'
import { useHistoryDesktop, type HistoryRow } from './useHistoryDesktop'

interface RowProps extends HistoryRow {
    isActive: boolean
    toggleFn: () => void
    claimsLabel: string
}

const Row = ({ isActive, toggleFn, claimsLabel, imgSrc, imgSrcFallback, status, tokenAmount, date, totalEstimatedUsd, imgBg, retailerName, description }: RowProps): JSX.Element => {
    const [fallbackLogo, setFallbackLogo] = useState('')
    // The claims aggregate: one row standing for every claim of a token. It is
    // the row with no retailer behind it — not every row whose status reads
    // "Claimed", which is an ordinary purchase that has been paid out.
    const isClaim = !retailerName
    const name = retailerName || claimsLabel
    return (
        <div id="history-desktop-row" className={`${styles.collapsible} ${isActive ? styles.collapsible_open : ''}`}>
            <div
                className={`${styles.details_container} ${isClaim ? styles.claim_row : ''}`}
                onClick={toggleFn}
            >
                <div className={`${styles.cell} ${styles.cell_first}`}>
                <div className={styles.name_container}>
                    <div
                        className={`${styles.img_container} ${fallbackLogo ? styles.img_container_fallback : ''} ${isClaim ? styles.img_container_claim : ''}`}
                        style={fallbackLogo || isClaim ? {} : { background: imgBg || 'white' }}
                    >
                        {fallbackLogo ?
                            <div className={`${styles.fallback_logo} ${fallbackLogo.length === 2 ? styles.fallback_logo_two_letters : ''}`}>{fallbackLogo}</div>
                            :
                            <img
                                style={{ height: isClaim ? 'auto' : '100%' }}
                                className={`${styles.img} ${isClaim ? styles.img_claim : ''}`}
                                src={imgSrc}
                                alt="logo"
                                onError={(e) => {
                                    const img = e.currentTarget
                                    if (imgSrcFallback && img.getAttribute('src') !== imgSrcFallback) {
                                        img.src = imgSrcFallback
                                        return
                                    }
                                    setFallbackLogo(getInitials(name))
                                }}
                            />
                        }
                    </div>
                    <span className={styles.purchase_name}>{name}</span>
                </div>
                </div>
                <div className={styles.cell}>
                    <span className={styles.date}>{date}</span>
                </div>
                <div className={styles.cell}>
                    <div className={styles.amount}>
                        {totalEstimatedUsd ?
                            <>
                                <span>{tokenAmount}</span>
                                {
                                    totalEstimatedUsd !== 0 ?
                                        <>
                                            <span>/</span>
                                            <span>{totalEstimatedUsd}</span>
                                        </>
                                        :
                                        null
                                }
                            </>
                            :
                            <span>{tokenAmount}</span>
                        }
                    </div>
                </div>
                <div className={styles.cell}>
                    <div className={`${styles.status} ${status.toLowerCase().startsWith('in ') ? styles.pending : styles[status.toLowerCase()] || ''}`}>{status}</div>
                </div>
                <div className={`${styles.cell} ${styles.cell_details}`}>
                    <button
                        id="history-desktop-details-btn"
                        className={`${styles.details_btn} ${isActive ? styles.rotate : ''}`}
                    >
                        <Icon name="arrow-down.svg" alt="arrow-down" />
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {isActive && <motion.div
                    className={styles.description_container}
                    initial={{ height: 0, opacity: 0, minHeight: 0 }}
                    animate={{ height: 'auto', opacity: 1, minHeight: '40px' }}
                    exit={{ height: 0, opacity: 0, minHeight: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div>
                        {description.map((item, index) => {
                            
                            return (
                                <div
                                    key={`description-${index}`}
                                    className={styles.description}
                                >
                                    {
                                        item[0] || item[1] ?
                                            <>
                                                <b>{item[0]}</b> - {item[1]}
                                                {item[2] && (
                                                    <span className={styles.txid}>
                                                        TxID: {item[2]}
                                                    </span>
                                                )}
                                            </>
                                            : null
                                    }
                                </div>
                            )
                        })}
                    </div>
                </motion.div>}
            </AnimatePresence>
        </div >
    )
}

const HistoryDesktop = () => {
    const { rows, isOpen, toggleRow, goToView, goBack, labels } = useHistoryDesktop()
    const [imgExists, setImgExists] = useState(true)

    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
            {/* Same row as the home page; switching view leaves for it. */}
            <Dashboard
                view="cashback"
                onViewChange={goToView}
            />
            <div className={styles.toolbar}>
            <Link
                id="history-desktop-back-btn"
                className={styles.back_btn}
                to='..'
                onClick={e => { e.preventDefault(); goBack() }}
            >
                <span className={styles.back_icon}>
                    <Icon name="arrow-left.svg" alt="" />
                </span>
                <span className={styles.back_btn_text}>
                    {labels.back}
                </span>
            </Link>
                <h1 className={styles.title}>{labels.title}</h1>
            </div>
            {rows.length ? (
                    <div className={styles.table_scroll}>
                    <div className={styles.table}>
                        <div className={styles.table_header}>
                            {/* Every label is a platform's to rename (SOLFLARE
                                and GERO both do); DEFAULT holds the wording the
                                rest fall back to. */}
                            <span className={styles.table_header_cell}>{labels.colPurchase}</span>
                            <span className={styles.table_header_cell}>{labels.colDate}</span>
                            <span className={styles.table_header_cell}>{labels.colAmount}</span>
                            <span className={styles.table_header_cell}>{labels.colStatus}</span>
                            <span className={styles.table_header_cell}>{labels.colDetails}</span>
                        </div>
                        {
                            rows.map((item, i) =>
                                <Row
                                    key={`history-${i}`}
                                    isActive={isOpen(i)}
                                    toggleFn={() => toggleRow(i, item)}
                                    claimsLabel={labels.totalClaims}
                                    {...item}
                                />
                            )
                        }
                    </div>
                    </div>
            ) : (
                <div className={styles.empty_container}>
                    <div className={styles.placeholder}>
                        {imgExists ? (
                            <Icon
                                name="no-history.svg"
                                alt="history"
                                onError={() => setImgExists(false)}
                            />
                        ) : null}
                        <div className={styles.empty_history}>{labels.emptyHistory}</div>
                    </div>
                </div>
            )}
            </main>
        </div>
    )
}

export default HistoryDesktop;