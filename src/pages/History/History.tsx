import styles from './styles.module.css'
import { useRouteLoaderData } from "react-router-dom"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import fetchCache from "../../api/fetchCache"
import { Link } from 'react-router-dom'
// import { sendGaEventBring } from "@/utils/bringWeb3/services/googleAnalytics"

interface HistoryObj {
    [key: string]: any
}
// interface HistoryProps {
//     history: Movements | null
//     retailerIconBasePath: string
// }

const daysLeft = (date: string): number => {
    const targetDate: Date = new Date(date)

    const currentDate: Date = new Date()

    const timeDifference: number = targetDate.getTime() - currentDate.getTime()

    return Math.max(1, Math.ceil(timeDifference / (1000 * 60 * 60 * 24)))
}

const formatDate = (date: string): string => {
    const format = new Date(date)

    return format.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

const History = (): JSX.Element => {
    const { walletAddress, platform } = useRouteLoaderData('root') as LoaderData

    const { data: balance } = useQuery({
        queryFn: () => fetchCache({ walletAddress, platform }),
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })

    const [activeHistory, setActiveHistory] = useState(-1)
    // const { address: walletAddress } = useAccount()

    // const sendGA = (status: string) => {
    // sendGaEventBring({
    //     name: "history_expand",
    //     parameters: {
    //         walletAddress,
    //         platform: "AURORA",
    //         category: "user_action",
    //         action: "click",
    //         details: status,
    //     },
    // })
    // }
    let totalClaimsAmount: number | string =
        balance?.data.movements?.claims.reduce((total, item) => {
            return total + +item.tokenAmount
        }, 0) || 0

    totalClaimsAmount = totalClaimsAmount.toLocaleString(undefined, {
        minimumFractionDigits: totalClaimsAmount ? 2 : 0,
        maximumFractionDigits: 2,
    })

    const createDescription = (item: HistoryObj, retailerName: string) => {
        if (item.description) {
            return (
                <div>
                    <b>{formatDate(item.date)} -</b> {item.description}
                </div>
            )
        }

        switch (item.action) {
            case "PURCHASE_POSTED":
                return (
                    <div>
                        <b>{formatDate(item.date)} -</b>{" "}
                        {item.tokenAmount + " " + item.tokenSymbol} rewards for purchasing
                        at <i>{retailerName}</i>.<br />
                        <b>Status:</b> Pending for the end of the return period.
                    </div>
                )
            case "PURCHASE_APPROVED":
                return (
                    <div>
                        <span className={styles.date}>{formatDate(item.date)} -</span>{" "}
                        {item.tokenAmount + " " + item.tokenSymbol} eligible rewards for
                        purchasing at {retailerName}.<br />
                    </div>
                )
            case "PURCHASE_CORRECTED":
                return (
                    <div>
                        <b>{formatDate(item.date)} -</b>{" "}
                        {item.tokenAmount + " " + item.tokenSymbol} — purchase corrected.{" "}
                        {item.correctionReason ? item.correctionReason : ""}
                        <br />
                    </div>
                )
        }
        return <></>
    }

    const createStatus = (status: string, eligibleDate: number): JSX.Element => {
        switch (status) {
            case "completed":
                return (
                    <div className={styles.status}>
                        Completed
                    </div>
                )
            case "pending":
                return (
                    <div className={styles.status}>
                        Available in {eligibleDate} {eligibleDate > 1 ? "days" : "day"}
                    </div>
                )
            case "canceled":
                return (
                    <div className={`${styles.status} ${styles.canceled}`}>
                        Canceled
                    </div>
                )
            default:
                return (
                    <div className={styles.status}>
                        Available in {eligibleDate} {eligibleDate > 1 ? "days" : "day"}
                    </div>
                )
        }
    }

    const createClaimNode = (): JSX.Element => {
        return (
            <>
                <div className={styles.node_container}>
                    <div className={styles.inner}>
                        <div className={styles.img}>
                            <img
                                width={32}
                                height={32}
                                src="icons/gift.svg"
                                alt="gift-icon"
                            />
                        </div>
                        <div className={styles.primary}>
                            Claimed
                        </div>
                    </div>
                    <div className={styles.inner}>
                        <div className={styles.inner_col}>
                            <div className={styles.primary}>
                                {`${totalClaimsAmount} AURORA`}
                            </div>
                        </div>
                        <button
                            className={styles.btn}
                            onClick={() => {
                                setActiveHistory(activeHistory === -2 ? -1 : -2)
                                // sendGA("claimed")
                            }}
                        >
                            <img
                                className={`${styles.img_container} ${activeHistory === -2 ? styles.rotate : ''}`}
                                src={"icons/arrow-down.svg"}
                                alt="logo"
                            />
                        </button>
                    </div>
                </div>
                <AnimatePresence>
                    {activeHistory === -2 && (
                        <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className={styles.collapsible}
                        >
                            {balance?.data.movements?.claims.map((item, index) => (
                                <div
                                    key={`history-claim-${index}`}
                                    className={styles.description}
                                >
                                    <div>
                                        <b>{formatDate(item.date)} -</b>{" "}
                                        {`${(+item.tokenAmount).toLocaleString()} ${item.tokenSymbol
                                            }`}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )
    }

    const createDealNode = (deal: Deal, id: number): JSX.Element => {
        const eligibleDate = daysLeft(deal.eligibleDate)

        return (
            <>
                <div className={styles.node_container}>
                    <div className={styles.inner}>
                        <div style={{ background: `${deal.retailerBackgroundColor || 'white'}`, borderRadius: '50%', width: '62px', height: '62px' }}>
                            <img
                                className={styles.retailer_img}
                                src={`${balance?.retailerIconBasePath}${deal.retailerIconPath}`}
                                width={62}
                                height={62}
                            // retailerName={deal.retailerName}
                            />
                        </div>
                        <div>
                            <div className={styles.name}>
                                {deal.retailerName}
                            </div>
                            {createStatus(deal.status, eligibleDate)}
                        </div>
                    </div>
                    <div className={styles.inner}>
                        <div className={styles.inner_col}>
                            <div className={styles.name}>{`${deal.tokenAmount} ${deal.tokenSymbol}`}</div>
                            <div className={styles.amount}>
                                {deal.totalEstimatedUsd
                                    ? `${(+deal.totalEstimatedUsd).toLocaleString(undefined, {
                                        style: "currency",
                                        currency: "USD",
                                    })}`
                                    : ""}
                            </div>
                        </div>
                        <button
                            className={styles.btn}
                            onClick={() => {
                                setActiveHistory(activeHistory === id ? -1 : id)
                                // sendGA(deal.status)
                            }}
                        >
                            <img
                                className={`${styles.img_container} ${activeHistory === id ? styles.rotate : ''}`}
                                src={"icons/arrow-down.svg"}
                                alt="logo"
                            />
                        </button>
                    </div>
                </div>
                <AnimatePresence>
                    {activeHistory === id && (
                        <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className={styles.collapsible}
                        >
                            {(deal.history as any).toReversed().map((item: any, index: any) => (
                                <div
                                    key={`history-${id}-${index}`}
                                    className={styles.description}
                                >
                                    {createDescription(item, deal.retailerName)}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )
    }

    const createList = (): JSX.Element => {
        if (!balance?.data.movements?.deals.length && !balance?.data.movements?.claims.length) {
            return (
                <div className={styles.empty}>
                    There is no transaction data yet
                </div>
            )
        }

        return (
            <>
                {balance.data.movements?.claims.length ? (
                    <div className={styles.subcontainer}>
                        {createClaimNode()}
                    </div>
                ) : null}
                {balance.data.movements?.deals.map((item, i) => (
                    <div
                        className={styles.subcontainer}
                        key={`history-${i}`}
                    >
                        {createDealNode(item, i)}
                    </div>
                ))}
            </>
        )
    }

    return (
        <div className={styles.container}>
            <Link
                className={styles.back}
                to='/'
            >
                Back
            </Link>
            <div className={styles.title}>
                Transaction history
            </div>
            <div className={styles.main}>
                <hr className={styles.hr} />
                {createList()}
            </div>
        </div>
    )
}

export default History;
