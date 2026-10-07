/**
 * Logic hook for the desktop header. Owns the scrolled flag, the overflow
 * menu's open state and its dismissal, the explain modal's state and the
 * action list both surfaces render — so the view is pure UI.
 *
 * Named for the surface because `useHeader` is the mobile header's hook.
 */
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'

export interface Action {
    key: string
    label: string
    to?: string
    external?: boolean
    onClick?: () => void
}

export const useHeaderDesktop = () => {
    const { t } = useTranslation()
    const { platform, isHub } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [menuOpen, setMenuOpen] = useState(false)
    const [explainOpen, setExplainOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const helpRef = useRef<HTMLDivElement>(null)
    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress}&env=${ENV}`

    // The fade only belongs there once rows are actually passing underneath.
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 0)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (!menuOpen) return
        const onPointerDown = (e: PointerEvent) => {
            if (!helpRef.current?.contains(e.target as Node)) setMenuOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [menuOpen])

    const whatsThis: Action = { key: 'whats-this', label: t('whatsThis'), onClick: () => setExplainOpen(true) }
    const needHelp: Action = { key: 'need-help', label: t('needHelp'), to: '/faq' }
    const missingReward: Action = { key: 'missing-reward', label: t('frequentlyAskedQuestion'), to: supportUrl, external: true }

    return {
        isHub,
        scrolled,
        helpRef,
        menuOpen,
        toggleMenu: () => setMenuOpen(open => !open),
        closeMenu: () => setMenuOpen(false),
        explainOpen,
        closeExplain: () => setExplainOpen(false),
        // The bar and the overflow menu carry the same actions in different orders.
        barActions: [needHelp, missingReward, whatsThis],
        menuActions: [whatsThis, needHelp, missingReward],
        labels: {
            title: t('title'),
            moreActions: t('moreActions'),
        },
    }
}
