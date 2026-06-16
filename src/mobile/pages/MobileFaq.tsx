/*
 * Mobile FAQ — bottom-sheet overlay. Pure UI — logic in useMobileFaq.
 */
import MobileHeader from '../../components/Header/Header.mobile'
import MobileFaqItem from '../../components/FaqItem/FaqItem.mobile'
import MobileHome from './MobileHome'
import { useMobileFaq } from '../hooks/useMobileFaq'
import styles from './MobileFaq.module.css'

const SKELETON_COUNT = 7

const MobileFaq = () => {
    const { t, faq, indentationMark, isLoading, openOrder, close, onToggle } = useMobileFaq()

    return (
        <div className={styles.root} data-testid="mobile-faq">
            <div className={styles.behind} aria-hidden="true">
                <MobileHome />
            </div>
            <div className={styles.darken} aria-hidden="true" onClick={close} />
            <div className={styles.sheet} role="dialog" aria-modal="true">
                <MobileHeader title={t('faq') || 'FAQ'} onBack={close} />
                <main className={styles.content}>
                    {isLoading ? (
                        <div className={styles.list} aria-hidden="true">
                            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                <span key={i} className={styles.skeletonItem}>
                                    <span className={styles.skeletonBar} />
                                </span>
                            ))}
                        </div>
                    ) : (
                        <>
                        <p className={styles.intro}>
                            {t('faqIntro') || 'If you have any question, please read the FAQ below:'}
                        </p>
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
                                    onToggle={() => onToggle(item.itemOrder)}
                                />
                            ))}
                        </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default MobileFaq
