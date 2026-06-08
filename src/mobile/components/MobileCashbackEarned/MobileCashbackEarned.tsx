/** Mobile portal hero "Cashback earned" card: total earned amount + USD subtitle. */
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import { useRive, Layout, Fit } from '@rive-app/react-canvas'
import Icon from '../../../components/Icon/Icon'
import { useBalance, selectEligible, selectPending, selectTotalEarned } from '../../hooks/useBalance'
import styles from './styles.module.css'

const formatUsd = (value: number): string => {
    // Always render two decimals so the zero state reads "$0.00", not "$0".
    if (!Number.isFinite(value) || value <= 0) return '$0.00'
    return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

const MobileCashbackEarned = () => {
    const { t } = useTranslation()
    const { cryptoSymbols, iconsPath } = useRouteLoaderData('root') as LoaderData
    const { data, isLoading } = useBalance()

    const { RiveComponent } = useRive({
        src: `${iconsPath}/fennec-fox.riv`,
        autoplay: true,
        layout: new Layout({ fit: Fit.Cover }),
    })

    const eligible = selectEligible(data)
    const pending = selectPending(data)
    const totalEarned = selectTotalEarned(data)

    // Hero number = backend's aggregate totalEarned; fall back to "0.00".
    const amountDisplay = totalEarned?.tokenAmountDisplay ?? '0.00'
    const symbol =
        totalEarned?.tokenSymbol ??
        eligible?.tokenSymbol ??
        pending?.tokenSymbol ??
        cryptoSymbols?.[0] ??
        ''
    // USD subtitle from backend's aggregate value; fall back to 0 (eligible + pending would miss the claimed portion).
    const usdTotal = totalEarned?.totalEstimatedUsd ?? 0

    // Loading skeleton: neutral tile, placeholder bars, no fox.
    if (isLoading) {
        return (
            <section
                className={`${styles.root} ${styles.loading}`}
                aria-label={t('cashbackEarned') || 'Cashback earned'}
                aria-busy="true"
            >
                <div className={styles.body}>
                    <span
                        className={`${styles.skeleton} ${styles.skeletonLabel}`}
                        aria-hidden="true"
                    />
                    <div className={styles.skeletonAmountGroup}>
                        <span
                            className={`${styles.skeleton} ${styles.skeletonAmount}`}
                            aria-hidden="true"
                        />
                        <span
                            className={`${styles.skeleton} ${styles.skeletonSub}`}
                            aria-hidden="true"
                        />
                    </div>
                </div>
                <span
                    className={`${styles.skeleton} ${styles.skeletonDeco}`}
                    aria-hidden="true"
                />
            </section>
        )
    }

    return (
        <section
            className={styles.root}
            aria-label={t('cashbackEarned') || 'Cashback earned'}
        >
            <div className={styles.body}>
                <div className={styles.labelRow}>
                    <Icon
                        name="piggy-bank.svg"
                        className={styles.labelIcon}
                        aria-hidden="true"
                    />
                    <p className={styles.label}>
                        {t('cashbackEarned') || 'Cashback earned'}
                    </p>
                </div>
                <div className={styles.amountGroup}>
                    <p className={styles.amount}>
                        {amountDisplay}
                        {symbol ? ` ${symbol}` : null}
                    </p>
                    <p className={styles.sub}>
                        {t('currentValue') || 'Current value'}: {formatUsd(usdTotal)}
                    </p>
                </div>
            </div>
            <RiveComponent
                className={styles.deco}
                aria-hidden="true"
            />
        </section>
    )
}

export default MobileCashbackEarned
