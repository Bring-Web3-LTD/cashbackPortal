/**
 * Logic hook for the legal bar. Reads the two links off the session and
 * resolves their labels — so the view is pure UI.
 */
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'

export const useLegalBar = () => {
    const { t } = useTranslation()
    const { bringTou, privacy } = useRouteLoaderData('root') as LoaderData

    return {
        privacy,
        bringTou,
        // Nothing to dock when the session carries neither link.
        visible: Boolean(privacy || bringTou),
        labels: {
            privacy: t('privacy', 'Privacy'),
            termsOfUse: t('termsOfUse', 'Terms of Use'),
        },
    }
}
