/**
 * Logic hook for the FilterChip. Resolves the i18n labels so the view holds
 * no logic and renders only what it's handed.
 */
import { useTranslation } from 'react-i18next'

export const useFilterChip = () => {
    const { t } = useTranslation()

    return {
        labels: {
            close: t('close'),
        },
    }
}
