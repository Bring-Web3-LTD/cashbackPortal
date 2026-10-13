/**
 * Logic hook for the FAQ page. Owns the open-entry state and the
 * close/toggle handlers; surfaces the faq list + indentation mark + loading
 * flag so the page view is pure UI.
 */
import { useState } from 'react'
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFaq } from './useFaq'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'

export const useFaqPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { platform } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { data, isLoading } = useFaq()
    // Keyed by id: itemOrder repeats across the shared and platform rows.
    const [openId, setOpenId] = useState<string | null>(null)

    const close = () => navigate(-1)
    const onToggle = (id: string) =>
        setOpenId((cur) => (cur === id ? null : id))

    const faq = data?.faq ?? []
    const indentationMark = data?.indentationMark ?? ''

    // Same destination as the More page's "Missing Reward" action.
    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress ?? ''}&env=${ENV}`

    const labels = {
        title: t('faq'),
        intro: t('faqIntro'),
        didntFind: t('didntFind'),
        contactUs: t('contactUs'),
    }

    return {
        labels,
        faq,
        indentationMark,
        isLoading,
        openId,
        close,
        onToggle,
        openSupport: () => window.open(supportUrl, '_blank', 'noopener,noreferrer'),
    }
}
