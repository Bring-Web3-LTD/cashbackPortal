/**
 * Logic hook for the desktop history page. Owns the balance query, the
 * projection of claims and deals into table rows, the open-row state and the
 * labels — so the page view is pure UI.
 *
 * Named for the surface because `useHistoryPage` is the mobile page's hook;
 * the query key matches so the two share one cache entry.
 */
import { useState } from 'react'
import { useLocation, useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import fetchCache from '../../api/fetchCache'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { createDescription, formatCurrency, formatDate, formatShortDate, formatStatus } from './helpers'

export interface HistoryRow {
    status: string
    tokenAmount: string
    date: string
    imgSrc: string
    imgSrcFallback?: string
    description: string[][]
    totalEstimatedUsd?: string | number
    imgBg?: string
    retailerName?: string
}

interface ClaimToken {
    tokenAmount: number
    description: string[][]
    tokenSymbol: string
    /** Most recent claim in the group — the row stands for all of them. */
    date: string
}

/* A deal that has been paid out or written off is no longer a reward the two
   dashboard cards count, so the details view leaves it out. Anything else -
   including a status the backend adds later, which renders as pending - stays. */
const SETTLED_STATUSES = ['claimed', 'cancelled']

export const useHistoryDesktop = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { sendAnalyticsEvent } = useAnalytics()
    const { platform, iconsPath, defaultIconsPath, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [activeRow, setActiveRow] = useState(-1)
    const rewardsOnly = Boolean((useLocation().state as { rewardsOnly?: boolean } | null)?.rewardsOnly)

    const { data } = useQuery({
        queryFn: async () => {
            const body: Parameters<typeof fetchCache>[0] = { platform, userId, flowId }
            if (walletAddress) body.walletAddress = walletAddress
            return await fetchCache(body)
        },
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })

    const balance = data?.data

    /** Every claim of a token collapses into one row carrying the total. */
    const createClaims = (claims: Claim[] | undefined): HistoryRow[] => {
        if (!claims) return []
        const res: { [key: string]: ClaimToken } = {}

        claims.forEach(claim => {
            const { tokenSymbol, tokenAmount, date, txid } = claim
            if (!res[tokenSymbol]) res[tokenSymbol] = { tokenSymbol, tokenAmount: 0, description: [], date }
            if (new Date(date) > new Date(res[tokenSymbol].date)) res[tokenSymbol].date = date

            const descriptionItem: string[] = [formatDate(date), `${tokenAmount} ${tokenSymbol}`]
            if (txid) descriptionItem.push(txid)

            res[tokenSymbol].description.push(descriptionItem)
            res[tokenSymbol].tokenAmount += tokenAmount
        })

        return Object.keys(res).map(key => ({
            ...res[key],
            tokenAmount: `${res[key].tokenAmount} ${key}`,
            date: formatShortDate(res[key].date),
            imgSrc: `${iconsPath}/gift.svg`,
            imgSrcFallback: `${defaultIconsPath}/gift.svg`,
            tokenSymbol: key,
            status: formatStatus('claimed'),
        }))
    }

    const createDeals = (deals: Deal[] | undefined, retailerIconBasePath: string | undefined): HistoryRow[] => {
        if (!deals || !retailerIconBasePath) return []
        return deals.map(deal => ({
            tokenAmount: `${deal.tokenAmount} ${deal.tokenSymbol}`,
            // The purchase date, which is what the row is about.
            date: formatShortDate(deal.date ?? deal.startDate),
            totalEstimatedUsd: formatCurrency(deal.totalEstimatedUsd),
            status: formatStatus(deal.status, deal.eligibleDate),
            retailerName: deal.retailerDisplayName,
            imgSrc: `${retailerIconBasePath}${deal.retailerIconPath}`,
            imgBg: deal.retailerBackgroundColor,
            description: deal.history?.map(history => createDescription(history)) || [['']]
        }))
    }

    // Arrived from the dashboard's details button, which stands for the two
    // reward cards rather than for the ledger: it shows what is still in its
    // return window and what is ready to claim, and nothing that has already
    // settled. Filtering on the raw status, not the rendered one - formatStatus
    // turns "pending" into "In 5 days".
    const deals = rewardsOnly
        ? balance?.movements.deals?.filter(deal => !SETTLED_STATUSES.includes(deal.status))
        : balance?.movements.deals
    // The claims aggregate is a settled row by definition, so it goes too.
    const rows = (rewardsOnly ? [] : createClaims(balance?.movements.claims))
        .concat(createDeals(deals, data?.retailerIconBasePath))

    return {
        rows,
        isOpen: (index: number) => activeRow === index,
        toggleRow: (index: number, row: HistoryRow) => {
            if (activeRow === index) {
                setActiveRow(-1)
                return
            }
            setActiveRow(index)
            sendAnalyticsEvent('history_expand', {
                category: 'user_action',
                action: 'click',
                details: row.retailerName || 'Total claims',
            })
        },
        goToView: (view: 'coupons' | 'cashback') => navigate('/', { state: { view } }),
        goBack: () => {
            sendAnalyticsEvent('topbar_back', {
                category: 'user_action',
                action: 'click',
                details: 'to: /'
            })
            navigate(-1)
        },
        labels: {
            back: t('back'),
            title: t(rewardsOnly ? 'detailsTitle' : 'historyTitle'),
            colPurchase: t('historyColPurchase'),
            colDate: t('historyColDate'),
            colAmount: t('historyColAmount'),
            colStatus: t('historyColStatus'),
            colDetails: t('historyColDetails'),
            totalClaims: t('historyTotalClaims'),
            emptyHistory: t('emptyHistory'),
        },
    }
}
