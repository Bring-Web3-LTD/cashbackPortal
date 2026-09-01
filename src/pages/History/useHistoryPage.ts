/**
 * Logic hook for the More page and its Pending variant. Owns the open-row
 * state, the three help actions and the close handler; surfaces the history
 * rows + loading flag so the page view is pure UI.
 *
 * `only` narrows the rows to a single status — the Pending sheet is the same
 * screen with the help actions dropped, so it lives here rather than in a page
 * of its own.
 */
import { useState } from 'react'
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHistory } from '../../hooks/useHistory'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'

export const useHistoryPage = (only?: 'pending') => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { platform } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { rows, isLoading } = useHistory()
    const [openId, setOpenId] = useState<string | null>(null)

    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress ?? ''}&env=${ENV}`

    const labels = {
        title: t(only === 'pending' ? 'pendingTitle' : 'more'),
        empty: t('emptyHistory'),
        rewardHistory: t('rewardHistory'),
        needHelp: t('needHelp'),
        missingReward: t('missingReward'),
        whatsThis: t('whatsThis'),
    }

    return {
        labels,
        rows: only ? rows.filter((row) => row.rawStatus === only) : rows,
        isLoading,
        openId,
        close: () => navigate(-1),
        onToggle: (id: string) => setOpenId((cur) => (cur === id ? null : id)),
        goToFaq: () => navigate('/faq'),
        openSupport: () => window.open(supportUrl, '_blank', 'noopener,noreferrer'),
    }
}
