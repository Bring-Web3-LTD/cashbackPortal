import { FC, useState } from 'react'
import styles from './styles.module.css'
import { Link, useNavigate, useRouteLoaderData } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import fetchFaq from '../../api/fetchFaq'
import { useQuery } from '@tanstack/react-query'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useTranslation } from 'react-i18next'
import Icon from '../../components/Icon/Icon'
import Header from '../../components/Header/Header'
import Dashboard from '../../components/Dashboard/Dashboard'
import { useSkeletonPreview } from '../../hooks/useSkeletonPreview'

interface AnswerParserProps {
  answer: string[];
  links: Link[];
  indentationMark: string;
}

const AnswerParser: FC<AnswerParserProps> = ({ answer, links, indentationMark }) => {
  const parseText = (text: string) => {
    let result: (string | JSX.Element)[] = [text];

    links.forEach((link, linkIndex) => {
      result = result.flatMap((part) => {
        if (typeof part === 'string') {
          const splitPart = part.split(new RegExp(`(${link.linkText})`, 'i'));
          return splitPart.map((subPart, subIndex) => {
            if (subPart.toLowerCase() === link.linkText.toLowerCase()) {
              return (
                <a
                  id={`faq-link-${linkIndex}-${subIndex}`}
                  key={`${linkIndex}-${subIndex}`}
                  className={styles.link_btn}
                  href={link.href}
                  target='_blank'
                >
                  {subPart}
                </a>
              );
            }
            return subPart;
          });
        }
        return part;
      });
    });
    return result;
  };

  return (
    <div>
      {answer.map((line, index) => (
        <div
          className={line.startsWith(indentationMark) ? styles.pre : styles.p}
          key={index}
        >
          {parseText(line)}
        </div>
      ))}
    </div>
  );
};

// The design draws five placeholder rows; the real count is unknown until the
// FAQ answers.
const SKELETON_ROWS = [0, 1, 2, 3, 4]

const FrequentlyAskedQuestion = () => {
  const navigate = useNavigate()
  const { walletAddress, platform, userId, flowId } = useRouteLoaderData('root') as LoaderData
  const { sendAnalyticsEvent } = useAnalytics()
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(-1)

  const { data, isLoading } = useQuery({
    queryKey: ['faq', walletAddress, platform],
    queryFn: () => fetchFaq({ walletAddress, platform, userId, flowId }),
  })
  const skeletonPreview = useSkeletonPreview()
  const showSkeleton = isLoading || skeletonPreview

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
      {/* Same row as the home page; switching view leaves for it. */}
      <Dashboard
        view="cashback"
        onViewChange={view => navigate('/', { state: { view } })}
      />
      <div className={styles.toolbar}>
      <Link
        id="faq-back-btn"
        className={styles.back_btn}
        to={'..'}
        onClick={e => {
          e.preventDefault()
          sendAnalyticsEvent('topbar_back', {
            category: 'user_action',
            action: 'click',
            details: 'to: /'
          })
          navigate(-1)
        }}
      >
        <span className={styles.back_icon}>
          <Icon name="arrow-left.svg" alt="arrow" />
        </span>
        <span className={styles.back_btn_text}>
          {t('back')}
        </span>
      </Link>
        <h1 className={styles.title}>{t('faqTitle')}</h1>
      </div>
      <div className={styles.faq_container}>
        {
          showSkeleton ? SKELETON_ROWS.map(i => (
            <div key={i} className={`${styles.collapsible} ${styles.skeleton_row}`} aria-hidden="true">
              <div className={styles.text_col}>
                <span className={`${styles.skeleton_bar} skeleton_shimmer`} />
              </div>
            </div>
          )) : data?.faq?.map(item => (
            <div
              id={`faq-item-${item.id}`}
              key={item.question + item.id}
              className={styles.collapsible}
            >
              <div className={styles.text_col}>
                <div
                  className={styles.question}
                  onClick={() => setCurrentIndex(currentIndex === item.itemOrder ? -1 : item.itemOrder)}
                >
                  {item.question}
                </div>
                <AnimatePresence>
                  {currentIndex === item.itemOrder && <motion.div
                    className={styles.answer_container}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnswerParser
                      answer={item.answer}
                      links={item.links || []}
                      indentationMark={data.indentationMark}
                    />
                  </motion.div>}
                </AnimatePresence>
              </div>
              <div className={styles.content_cell}>
                <button
                  id={`faq-details-btn-${item.id}`}
                  className={`${styles.details_btn} ${currentIndex === item.itemOrder ? styles.rotate : ''}`}
                  onClick={() => setCurrentIndex(currentIndex === item.itemOrder ? -1 : item.itemOrder)}
                >
                  <Icon name="arrow-down.svg" alt="arrow-down" />
                </button>
              </div>
            </div>
          ))}
      </div>
      </main>
    </div>
  )
}

export default FrequentlyAskedQuestion