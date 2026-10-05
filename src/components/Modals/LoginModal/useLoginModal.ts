/**
 * Logic hook for the connect-wallet modal. Owns the two messages it posts to
 * the host and resolves the labels — so the view is pure UI.
 */
import { useTranslation } from 'react-i18next'
import message from '../../../utils/message'

interface Args {
    closeFn: () => void
    onConnect?: () => void
}

export const useLoginModal = ({ closeFn, onConnect }: Args) => {
    const { t } = useTranslation()

    return {
        onClose: () => {
            message({ action: 'POPUP_CLOSED' })
            closeFn()
        },
        promptLogin: () => {
            message({ action: 'LOGIN' })
            onConnect?.()
            closeFn()
        },
        labels: {
            title: t('connectYourWallet'),
            subtitle: t('connectWalletHint'),
            connect: t('connect'),
        },
    }
}
