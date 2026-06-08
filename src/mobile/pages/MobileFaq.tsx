/*
 * Mobile FAQ
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MobileHeader from '../components/MobileHeader/MobileHeader'
import MobileFaqItem from '../components/MobileFaqItem/MobileFaqItem'
import MobileHome from './MobileHome'
import { useFaq } from '../hooks/useFaq'
import styles from './MobileFaq.module.css'

const SKELETON_COUNT = 7

const MobileFaq = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { data, isLoading } = useFaq()
    const [openOrder, setOpenOrder] = useState<number | null>(null)

    const close = () => navigate(-1)

    const faq = data?.faq ?? []
    const indentationMark = data?.indentationMark ?? ''

    return (
        <div className={styles.root} data-testid="mobile-faq">
            <div className={styles.behind} aria-hidden="true">
                <MobileHome />
            </div>
            <div className={styles.darken} aria-hidden="true" onClick={close} />
            <div className={styles.sheet} role="dialog" aria-modal="true">
                <MobileHeader title={t('faq') || 'FAQ'} onBack={close} />
                <main className={styles.content}>
                    <p className={styles.intro}>
                        {t('faqIntro') || 'If you have any question, please read the FAQ below:'}
                    </p>

                    {isLoading ? (
                        <div className={styles.list} aria-hidden="true">
                            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                <span key={i} className={styles.skeletonItem}>
                                    <span className={styles.skeletonBar} />
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {faq.map((item) => (
                                <MobileFaqItem
                                    key={item.id}
                                    id={item.id}
                                    question={item.question}
                                    answer={item.answer}
                                    links={item.links ?? []}
                                    indentationMark={indentationMark}
                                    isOpen={openOrder === item.itemOrder}
                                    onToggle={() =>
                                        setOpenOrder((cur) =>
                                            cur === item.itemOrder ? null : item.itemOrder,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default MobileFaq
