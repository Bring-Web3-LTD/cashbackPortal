/**
 * Logic hook for the History page. Owns the open-row state and the
 * close/toggle handlers; surfaces the history rows + loading flag so the
 * page view is pure UI.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHistory } from '../../hooks/useHistory'

export const useHistoryPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { rows, isLoading } = useHistory()
    const [openId, setOpenId] = useState<string | null>(null)

    const close = () => navigate(-1)
    const onToggle = (id: string) =>
        setOpenId((cur) => (cur === id ? null : id))

    const labels = {
        title: t('historyTitle'),
        empty: t('emptyHistory'),
        rewardHistory: t('rewardHistory'),
    }

    return { labels, rows, isLoading, openId, close, onToggle }
}
