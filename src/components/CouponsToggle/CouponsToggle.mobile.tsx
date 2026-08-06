/**
 * Coupons / Cashback vertical switcher (Figma "tab-switcher", node 278:4725).
 * Mobile-only; rendered only when the verify response provides
 * couponsIframeSrc. "Cashback" shows the regular offers; "Coupons" swaps the
 * page content for the partner's coupons iframe.
 *
 * PLACEHOLDER for now — the final design/spec for this switcher is still
 * pending; expect markup and styles to be replaced when it lands.
 */
import { useTranslation } from 'react-i18next'
import styles from './styles.mobile.module.css'

export type PortalView = 'coupons' | 'cashback'

interface Props {
    value: PortalView
    onChange: (view: PortalView) => void
}

const CouponsToggle = ({ value, onChange }: Props) => {
    const { t } = useTranslation()
    const options: { key: PortalView; label: string }[] = [
        { key: 'coupons', label: t('coupons') },
        { key: 'cashback', label: t('cashback') },
    ]

    return (
        <div className={styles.root}>
            {options.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    aria-pressed={value === key}
                    className={`${styles.option} ${value === key ? styles.optionActive : ''}`}
                    onClick={() => onChange(key)}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}

export default CouponsToggle
