import { useState } from 'react'
import styles from './styles.module.css'
import { Link, useNavigate, useRouteLoaderData } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const faq = [
  {
    question: 'I didn’t get my reward',
    answer: [
      "After you make a purchase, the reward should appear in the pending rewards section after 48 hours, if you don't see it please "
    ],
    link: 'Click here.',
  },
  {
    question: 'How it works?',
    answer: [
      `Search for your favorite items and brands, browse through
      various categories, or explore our top brands to find exactly
      what you need.`,
      `Once you've made your selection, complete your purchase using
      your preferred fiat payment method, such as a credit card,
      PayPal, Apple Pay, Google Pay, or other digital wallets.`,
      `Within 48 hours, your crypto cashback will appear in the
      "pending rewards" area.`,
      `After the specified lock period ends, simply check your pending
      cashback and claim your crypto rewards with a few clicks. The
      cashback will then be instantly transferred to your Aurora
      wallet.`,
      `Enjoy up to 20% in crypto cashback on every purchase, making
      your shopping experience not only enjoyable but also
      highly rewarding.`
    ],
  },
  {
    question: 'What is Bring?',
    answer: ['Bring is a digital wallet that allows you to earn cashback on your purchases.'],
  }
]

const FrequentlyAskedQuestion = () => {
  const navigate = useNavigate()
  const { iconsPath } = useRouteLoaderData('root') as LoaderData
  const [currentIndex, setCurrentIndex] = useState(-1)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        FAQ
      </h1>
      <div className={styles.faq_container}>
        {
          faq.map((item, i) => (
            <div
              key={item.question + i}
              className={`${styles.collapsible} ${currentIndex === i ? styles.collapsible_open : styles.collapsible_hover}`}
            >
              <div
                className={styles.question_container}
                onClick={() => setCurrentIndex(currentIndex === i ? -1 : i)}
              >
                <div className={styles.question}>
                  {item.question}
                </div>
                <button
                  className={`${styles.details_btn} ${currentIndex === i ? styles.rotate : ''}`}
                >
                  <img src={`${iconsPath}/arrow-down.svg`} alt="arrow-down" />
                </button>
              </div>
              <AnimatePresence>
                {currentIndex === i && <motion.div
                  className={styles.answer_container}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.answer.map((ans, j) =>
                    <p
                      className={styles.p}
                      key={`ans-${i}-${j}`}
                    >
                      {ans}{item.link && j === item.answer.length - 1 ?
                        <button className={styles.link_btn}>{item.link}</button> : null}
                    </p>
                  )}
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
          navigate(-1)
        }}
      >
        <img src={`${iconsPath}/arrow-left.svg`} alt="" />
        Back
      </Link>
    </div>
  )
}

export default FrequentlyAskedQuestion