import { FC, useState } from 'react'
import styles from './styles.module.css'
import { Link, useNavigate, useRouteLoaderData } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import fetchFaq from '../../api/fetchFaq'
import { useQuery } from '@tanstack/react-query'
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { useTranslation } from 'react-i18next'

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
        <p
          className={line.startsWith(indentationMark) ? styles.pre : styles.p}
          key={index}
        >
          {parseText(line)}
        </p>
      ))}
    </div>
  );
};

const FrequentlyAskedQuestion = () => {
  const navigate = useNavigate()
  const { iconsPath, walletAddress, platform } = useRouteLoaderData('root') as LoaderData
  const { sendGaEvent } = useGoogleAnalytics()
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(-1)

  const { data } = useQuery({
    queryKey: ['faq', walletAddress, platform],
    queryFn: () => fetchFaq({ walletAddress, platform })
  })

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        FAQ
      </h1>
      <div className={styles.faq_container}>
        {
          data?.faq?.map(item => (
            <div
              key={item.question + item.id}
              className={`${styles.collapsible} ${currentIndex === item.itemOrder ? styles.collapsible_open : ''}`}
            >
              <div
                className={styles.question_container}
                onClick={() => setCurrentIndex(currentIndex === item.itemOrder ? -1 : item.itemOrder)}
              >
                <div className={styles.question}>
                  {item.question}
                </div>
                <button
                  className={`${styles.details_btn} ${currentIndex === item.itemOrder ? styles.rotate : ''}`}
                >
                  <img src={`${iconsPath}/arrow-down.svg`} alt="arrow-down" />
                </button>
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
          ))}
      </div>
      <Link
        className={styles.back_btn}
        to={'..'}
        onClick={e => {
          e.preventDefault()
          sendGaEvent('topbar_back', {
            category: 'user_action',
            action: 'click',
            details: 'to: /'
          })
          navigate(-1)
        }}
      >
        <img src={`${iconsPath}/arrow-left.svg`} alt="arrow" />
        <span className={styles.back_btn_text}>
          {t('back')}
        </span>
      </Link>
    </div>
  )
}

export default FrequentlyAskedQuestion