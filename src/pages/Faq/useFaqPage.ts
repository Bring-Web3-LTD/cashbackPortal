/**
 * Logic hook for the FAQ page. Owns the open-entry state and the
 * close/toggle handlers; surfaces the faq list + indentation mark + loading
 * flag so the page view is pure UI.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFaq } from '../../mobile/hooks/useFaq'

export const useFaqPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { data, isLoading } = useFaq()
    const [openOrder, setOpenOrder] = useState<number | null>(null)

    const close = () => navigate(-1)
    const onToggle = (itemOrder: number) =>
        setOpenOrder((cur) => (cur === itemOrder ? null : itemOrder))

    const faq = data?.faq ?? []
    const indentationMark = data?.indentationMark ?? ''

    return { t, faq, indentationMark, isLoading, openOrder, close, onToggle }
}
