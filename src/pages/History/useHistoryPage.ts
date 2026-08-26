/**
 * Logic hook for the More page. Owns the open-row state, the three help
 * actions and the close handler; surfaces the history rows + loading flag so
 * the page view is pure UI.
 */
import { useState } from 'react'
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHistory } from '../../hooks/useHistory'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'

export const useHistoryPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { platform } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { rows, isLoading } = useHistory()
    const [openId, setOpenId] = useState<string | null>(null)

    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress ?? ''}&env=${ENV}`

    const labels = {
        title: t('more'),
        empty: t('emptyHistory'),
        rewardHistory: t('rewardHistory'),
        needHelp: t('needHelp'),
        missingReward: t('missingReward'),
        whatsThis: t('whatsThis'),
    }

    return {
        labels,
        rows,
        isLoading,
        openId,
        close: () => navigate(-1),
        onToggle: (id: string) => setOpenId((cur) => (cur === id ? null : id)),
        goToFaq: () => navigate('/faq'),
        openSupport: () => window.open(supportUrl, '_blank', 'noopener,noreferrer'),
    }
}
