/**
 * Logic hook for the Pending page. Filters the shared history rows down to the
 * pending ones and owns the open-row state, so the page view is pure UI.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHistory } from '../../hooks/useHistory'

export const usePendingPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { rows, isLoading } = useHistory()
    const [openId, setOpenId] = useState<string | null>(null)

    const labels = {
        title: t('pendingTitle'),
        rewardHistory: t('rewardHistory'),
        empty: t('emptyHistory'),
    }

    return {
        labels,
        rows: rows.filter((row) => row.rawStatus === 'pending'),
        isLoading,
        openId,
        close: () => navigate(-1),
        onToggle: (id: string) => setOpenId((cur) => (cur === id ? null : id)),
    }
}
