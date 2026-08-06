/**
 * Disconnected-state screen for the Coupons view: "connect to unlock" promo.
 *
 * PLACEHOLDER: there is no design/spec for this screen yet - this whole
 * component (markup, styles, copy) is disposable and should be replaced
 * wholesale when the final design lands. Copy is hard-coded on purpose (not
 * in the translation files) so deleting the component leaves nothing behind.
 * The only contract to keep: the button posts the LOGIN action (same as the
 * desktop LoginModal) so the host wallet opens its connect flow.
 */
import { useTranslation } from 'react-i18next'
import message from '../../utils/message'
import styles from './styles.mobile.module.css'

const CouponsConnect = () => {
    const { t } = useTranslation()

    return (
        <div className={styles.root}>
            <div className={styles.glow} aria-hidden="true" />
            <div className={styles.promo}>
                <span className={`${styles.chip} ${styles.chipA}`} aria-hidden="true">%</span>
                <span className={`${styles.chip} ${styles.chipB}`} aria-hidden="true">$</span>
                <div className={styles.ticketStack} aria-hidden="true">
                    <div className={styles.couponBack} />
                    <div className={styles.coupon}>
                        <span className={styles.couponPct}>%</span>
                        <span className={styles.couponDivider} />
                        <span className={styles.couponText}>Exclusive deals</span>
                    </div>
                </div>
                <h3 className={styles.title}>Stop paying full price</h3>
                <p className={styles.sub}>
                    Verified promo codes and instant discounts from top brands.
                    Real savings on shopping you'd do anyway. Connect once and
                    it's all yours.
                </p>
                <button
                    type="button"
                    className={styles.connectBtn}
                    onClick={() => message({ action: 'LOGIN' })}
                >
                    {t('connectYourWallet')}
                </button>
                <p className={styles.hint}>Takes seconds.</p>
            </div>
        </div>
    )
}

export default CouponsConnect
