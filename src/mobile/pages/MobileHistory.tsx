/*
 * Mobile History — bottom-sheet overlay.
 *
 * Presented as a modal sheet anchored to the bottom: the previous page
 * (Home) renders behind a darkening layer, and the History sheet slides
 * up leaving an ~88px gap at the top so the darkened page peeks through.
 * Rounded top corners + 1px border per the design.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MobileHeader from '../components/MobileHeader/MobileHeader'
import MobileHistoryItem from '../components/MobileHistoryItem/MobileHistoryItem'
import MobileHome from './MobileHome'
import Icon from '../../components/Icon/Icon'
import { useHistory } from '../hooks/useHistory'
import styles from './MobileHistory.module.css'

const SKELETON_COUNT = 5

const MobileHistory = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { rows, isLoading } = useHistory()
    const [openId, setOpenId] = useState<string | null>(null)

    const close = () => navigate(-1)

    return (
        <div className={styles.root} data-testid="mobile-history">
            {/* Previous page, rendered behind and made inert. */}
            <div className={styles.behind} aria-hidden="true">
                <MobileHome />
            </div>

            {/* Darkening layer over the previous page. */}
            <div className={styles.darken} aria-hidden="true" onClick={close} />

            {/* Bottom-sheet overlay. */}
            <div className={styles.sheet} role="dialog" aria-modal="true">
                <MobileHeader
                    title={t('historyTitle') || 'History'}
                    leftAction={null}
                    rightAction={
                        <button
                            type="button"
                            className={styles.close}
                            onClick={close}
                            aria-label={t('close') || 'Close'}
                        >
                            <Icon name="x-mark.svg" className={styles.closeIcon} />
                        </button>
                    }
                />
                <main className={styles.content}>
                    {!isLoading && rows.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyText}>
                                {t('emptyHistory') || 'No reward history found.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className={styles.intro}>
                                {t('rewardHistory') || 'Reward history'}
                            </p>

                            {isLoading ? (
                                <div className={styles.list} aria-hidden="true">
                                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                        <span key={i} className={styles.skeletonItem} />
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.list}>
                                    {rows.map((row) => (
                                        <MobileHistoryItem
                                            key={row.id}
                                            row={row}
                                            isOpen={openId === row.id}
                                            onToggle={() =>
                                                setOpenId((cur) =>
                                                    cur === row.id ? null : row.id,
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default MobileHistory

