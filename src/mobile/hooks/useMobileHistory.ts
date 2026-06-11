/**
 * Logic hook for the MobileHistory page. Owns the open-row state and the
 * close/toggle handlers; surfaces the history rows + loading flag so the
 * page .tsx is pure UI.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHistory } from './useHistory'

export const useMobileHistory = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { rows, isLoading } = useHistory()
    const [openId, setOpenId] = useState<string | null>(null)

    const close = () => navigate(-1)
    const onToggle = (id: string) =>
        setOpenId((cur) => (cur === id ? null : id))

    return { t, rows, isLoading, openId, close, onToggle }
}
