import styles from './styles.module.css'
import { Link, useRouteLoaderData, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import fetchCache from '../../../api/fetchCache'
import { createDescription, formatCurrency, formatDate, formatStatus } from '../helpers'
import { useGoogleAnalytics } from '../../../utils/hooks/useGoogleAnalytics'
import { useTranslation } from 'react-i18next'
import { useWalletAddress } from '../../../utils/hooks/useWalletAddress'

interface HistoryMobile {
    status: string
    tokenAmount: string;
    imgSrc: string
    description: string[][];
    totalEstimatedUsd?: string | number
    imgBg?: string
    retailerName?: string
}

interface RowProps extends HistoryMobile {
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

const Row = ({ isActive, toggleFn, imgSrc, status, tokenAmount, totalEstimatedUsd, imgBg, retailerName = 'Total claims', description }: RowProps): JSX.Element => {
    const { iconsPath } = useRouteLoaderData('root') as LoaderData

    return (
        <div className={`${styles.collapsible} ${isActive ? styles.collapsible_open : ''}`}>
            <div
                className={styles.details_container}
                onClick={toggleFn}
            >
                <div className={styles.name_container}>
                    <div
                        className={styles.img_container}
                        style={status.toLowerCase() === 'claimed' ? {} : { background: imgBg || 'white' }}
                    >
                        <img
                            style={{ height: `${status.toLowerCase() === 'claimed' ? 'auto' : '100%'}` }}
                            className={styles.img}
                            src={imgSrc}
                            alt="logo"
                        />
                    </div>
                    <span className={`${styles.purchase_name} ${retailerName.length > 20 ? '' : styles.nowrap}`}>{retailerName}</span>
                </div>
                <button
                    className={`${styles.details_btn} ${isActive ? styles.rotate : ''}`}
                >
                    <img src={`${iconsPath}/arrow-down.svg`} alt="arrow-down" />
                </button>
                <span>{tokenAmount}</span>
                {
                    totalEstimatedUsd ?
                        <>
                            <span>/</span>
                            <span>{totalEstimatedUsd}</span>
                        </>
                        :
                        null
                }
            </div>
            <hr className={styles.breakline} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px' }}>
                <div>Status:</div>
                <div className={`${styles.status} ${styles[status.toLowerCase()]}`}>{status}</div>
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

const HistoryMobile = () => {
    const [activeRow, setActiveRow] = useState(-1)
    const { sendGaEvent } = useGoogleAnalytics()
    const { t } = useTranslation()

    const { platform, iconsPath, userId, flowId } = useRouteLoaderData('root') as LoaderData
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

    const createClaims = (claims: Claim[] | undefined): HistoryMobile[] => {
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
            tokenSymbol: key,
            status: formatStatus('claimed'),
        }))

        return arr
    }

    const createDeals = (deals: Deal[] | undefined, retailerIconBasePath: string | undefined): HistoryMobile[] => {
        if (!deals || !retailerIconBasePath) return []
        return deals.map(deal => ({
            tokenAmount: `${deal.tokenAmount} ${deal.tokenSymbol}`,
            totalEstimatedUsd: formatCurrency(deal.totalEstimatedUsd),
            status: formatStatus(deal.status, deal.eligibleDate),
            retailerName: deal.retailerName,
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
                className={styles.back_btn}
                to='..'
                onClick={e => {
                    e.preventDefault()
                    sendGaEvent('topbar_back', {
                        category: 'user_action',
                        action: 'click',
                        details: 'to: /'
                    })
                    navigate(-1)
                }}
            >
                <img src={`${iconsPath}/arrow-left.svg`} alt="" />

            </Link>
            {balance?.movements.claims.length || balance?.movements.deals.length ? (
                <>
                    <h1 className={styles.title}>{t('historyTitle')}</h1>
                    <div className={styles.table}>
                        {
                            history.map((item, i) =>
                                <Row
                                    key={`history-${i}`}
                                    isActive={activeRow === i}
                                    toggleFn={() => {
                                        if (activeRow !== i) {
                                            setActiveRow(i)
                                            sendGaEvent('history_expand', {
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
                        <img
                            src={`${iconsPath}/no-history.svg`}
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

export default HistoryMobile;