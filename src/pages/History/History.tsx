import styles from './styles.module.css'
import { Link, useRouteLoaderData, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import fetchCache from '../../api/fetchCache'
import { createDescription, formatCurrency, formatDate, formatStatus } from './helpers'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useTranslation } from 'react-i18next'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import Icon from '../../components/Icon/Icon'
import { getInitials } from '../../utils/getInitials'

interface HistoryDesktop {
    status: string
    tokenAmount: string;
    imgSrc: string
    imgSrcFallback?: string
    description: string[][];
    totalEstimatedUsd?: string | number
    imgBg?: string
    retailerName?: string
}

interface RowProps extends HistoryDesktop {
    isActive: boolean
    toggleFn: () => void
}

interface ClaimToken {
    tokenAmount: number
    description: string[][]
    tokenSymbol: string
}

interface ClaimsRes {
    [key: string]: ClaimToken
}

const Row = ({ isActive, toggleFn, imgSrc, imgSrcFallback, status, tokenAmount, totalEstimatedUsd, imgBg, retailerName = 'Total claims', description }: RowProps): JSX.Element => {
    const [fallbackLogo, setFallbackLogo] = useState('')
    return (
        <div id="history-desktop-row" className={`${styles.collapsible} ${isActive ? styles.collapsible_open : ''}`}>
            <div
                className={styles.details_container}
                onClick={toggleFn}
            >
                <div className={styles.name_container}>
                    <div
                        className={`${styles.img_container} ${fallbackLogo ? styles.img_container_fallback : ''}`}
                        style={fallbackLogo || status.toLowerCase() === 'claimed' ? {} : { background: imgBg || 'white' }}
                    >
                        {fallbackLogo ?
                            <div className={`${styles.fallback_logo} ${fallbackLogo.length === 2 ? styles.fallback_logo_two_letters : ''}`}>{fallbackLogo}</div>
                            :
                            <img
                                style={{ height: `${status.toLowerCase() === 'claimed' ? 'auto' : '100%'}` }}
                                className={styles.img}
                                src={imgSrc}
                                alt="logo"
                                onError={imgSrcFallback ? (e) => {
                                    if (e.currentTarget.src !== imgSrcFallback) e.currentTarget.src = imgSrcFallback
                                } : () => setFallbackLogo(getInitials(retailerName))}
                            />
                        }
                    </div>
                    <span className={styles.purchase_name}>{retailerName}</span>
                </div>
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
                <div className={`${styles.status} ${status.toLowerCase().startsWith('in ') ? styles.pending : styles[status.toLowerCase()] || ''}`}>{status}</div>
                <button
                    id="history-desktop-details-btn"
                    className={`${styles.details_btn} ${isActive ? styles.rotate : ''}`}
                >
                    <Icon name="arrow-down.svg" alt="arrow-down" />
                </button>
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
    const [activeRow, setActiveRow] = useState(-1)
    const { sendAnalyticsEvent } = useAnalytics()
    const { t } = useTranslation()

    const { platform, iconsPath, defaultIconsPath, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const navigate = useNavigate()

    const { data } = useQuery({
        queryFn: async () => {
            const body: Parameters<typeof fetchCache>[0] = {
                platform,
                userId,
                flowId
            }

            if (walletAddress) body.walletAddress = walletAddress

            return await fetchCache(body)
        },
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })

    const balance = data?.data

    const createClaims = (claims: Claim[] | undefined): HistoryDesktop[] => {
        if (!claims) return []
        const res: ClaimsRes = {}

        claims.map(claim => {
            const { tokenSymbol, tokenAmount, date, txid } = claim
            if (!res[tokenSymbol]) res[tokenSymbol] = { tokenSymbol, tokenAmount: 0, description: [] }
            
            const descriptionItem: string[] = [formatDate(date), `${tokenAmount} ${tokenSymbol}`]
            if (txid) {
                descriptionItem.push(txid)
            }
            
            res[tokenSymbol].description.push(descriptionItem)
            res[tokenSymbol].tokenAmount += tokenAmount
        })

        const arr = Object.keys(res).map(key => ({
            ...res[key]
            , tokenAmount: `${res[key].tokenAmount} ${key}`,
            imgSrc: `${iconsPath}/gift.svg`,
            imgSrcFallback: `${defaultIconsPath}/gift.svg`,
            tokenSymbol: key,
            status: formatStatus('claimed'),
        }))

        return arr
    }

    const createDeals = (deals: Deal[] | undefined, retailerIconBasePath: string | undefined): HistoryDesktop[] => {
        if (!deals || !retailerIconBasePath) return []
        return deals.map(deal => ({
            tokenAmount: `${deal.tokenAmount} ${deal.tokenSymbol}`,
            totalEstimatedUsd: formatCurrency(deal.totalEstimatedUsd),
            status: formatStatus(deal.status, deal.eligibleDate),
            retailerName: deal.retailerDisplayName,
            imgSrc: `${retailerIconBasePath}${deal.retailerIconPath}`,
            imgBg: deal.retailerBackgroundColor,
            description: deal.history?.map(history => createDescription(history)) || [['']]
        }))
    }
    const [imgExists, setImgExists] = useState(true)
    const history = createClaims(balance?.movements.claims).concat(createDeals(balance?.movements.deals, data?.retailerIconBasePath))

    return (
        <div className={styles.container}>
            <Link
                id="history-desktop-back-btn"
                className={styles.back_btn}
                to='..'
                onClick={e => {
                    e.preventDefault()
                    sendAnalyticsEvent('topbar_back', {
                        category: 'user_action',
                        action: 'click',
                        details: 'to: /'
                    })
                    navigate(-1)
                }}
            >
                <Icon name="arrow-left.svg" alt="" />
                <span className={styles.back_btn_text}>
                    {t('back')}
                </span>
            </Link>
            {balance?.movements.claims.length || balance?.movements.deals.length ? (
                <>
                    <h1 className={styles.title}>{t('historyTitle')}</h1>
                    <div className={styles.table}>
                        <div className={styles.table_header}>
                            <span className={styles.table_header_cell}>Purchase</span>
                            <span className={styles.table_header_cell}>Amount</span>
                            <span className={styles.table_header_cell}>Status</span>
                            <span className={styles.table_header_cell}>Details</span>
                        </div>
                        {
                            history.map((item, i) =>
                                <Row
                                    key={`history-${i}`}
                                    isActive={activeRow === i}
                                    toggleFn={() => {
                                        if (activeRow !== i) {
                                            setActiveRow(i)
                                            sendAnalyticsEvent('history_expand', {
                                                category: 'user_action',
                                                action: 'click',
                                                details: item.retailerName || 'Total claims',
                                            })
                                        } else {
                                            setActiveRow(-1)
                                        }
                                    }}
                                    {...item}
                                />
                            )
                        }
                    </div>
                </>
            ) : (
                <div className={styles.empty_container}>
                    {imgExists ? (
                        <Icon
                            name="no-history.svg"
                            alt="history"
                            onError={() => setImgExists(false)}
                        />
                    ) : null}
                    <div className={styles.empty_history}>{t('emptyHistory')}</div>
                </div>
            )}
        </div>
    )
}

export default HistoryDesktop;