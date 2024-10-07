import { useState } from 'react'
import styles from './styles.module.css'
import { Link, useNavigate, useRouteLoaderData } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const faq = [
  {
    id: 0,
    question: 'I didn’t get my reward',
    answer: [
      `We're sorry that you're experiencing a challenge with your rewards.`,
      `Please check if any of the following issues`,
      `The most probable reasons for not seeing your rewards are -`,
      `\t1. You paid for your purchase less than 48 hours ago (it could take time for your reward to appear).`,
      `\t2. The wallet you were logged to, at the time of the purchase, was different from the current wallet you're logged to.`,
      `\t3. You didn’t meet the retailer’s cashback eligibility terms`,
      `If you feel that none of the above applies to your case and you'd like to be transferred to our support partner, Bring, `
    ],
    link: 'click here.',
    href: 'https://support.bringweb3.io/',
    target: '_blank'
  },
  {
    id: 1,
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
    id: 2,
    question: 'When can I claim pending rewards?',
    answer: [
      'The locking time varies between the different retailers, you can check the status on your history page.'
    ],
  },
  {
    id: 3,
    question: 'Why can’t I claim my rewards?',
    answer: [
      'There is a minimum amount to claim, you can see the exact amount in the “Claim cashback” section.'
    ],
  },
  {
    id: 4,
    question: 'I have multiple addresses in my wallet, how do I know to which one the cashback will go into?',
    answer: [
      'The cashback rewards are collected automatically into the wallet you were logged into while making the purchase. In case you don’t see your reward, please check your other addresses within the wallet.'
    ],
  }
]

const FrequentlyAskedQuestion = () => {
  const navigate = useNavigate()
  const { iconsPath, walletAddress, platform } = useRouteLoaderData('root') as LoaderData
  const [currentIndex, setCurrentIndex] = useState(-1)

  const getSupportLink = (url: string) => {
    const link = new URL(url)
    link.searchParams.append('address', walletAddress)
    link.searchParams.append('platform', platform)
    return link.href
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        FAQ
      </h1>
      <div className={styles.faq_container}>
        {
          faq.map(item => (
            <div
              key={item.question + item.id}
              className={`${styles.collapsible} ${currentIndex === item.id ? styles.collapsible_open : ''}`}
            >
              <div
                className={styles.question_container}
                onClick={() => setCurrentIndex(currentIndex === item.id ? -1 : item.id)}
              >
                <div className={styles.question}>
                  {item.question}
                </div>
                <button
                  className={`${styles.details_btn} ${currentIndex === item.id ? styles.rotate : ''}`}
                >
                  <img src={`${iconsPath}/arrow-down.svg`} alt="arrow-down" />
                </button>
              </div>
              <AnimatePresence>
                {currentIndex === item.id && <motion.div
                  className={styles.answer_container}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.answer.map((ans, j) =>
                    <p
                      className={styles.p}
                      key={`ans-${item.id}-${j}`}
                    >
                      {ans.startsWith('\t') ? <pre>{ans}</pre> : ans}
                      {
                        item.link && j === item.answer.length - 1 ?
                          <a href={item.id === 0 ? getSupportLink(item.href) : item.href} target={item.target} className={styles.link_btn}>{item.link}</a>
                          : null}
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
        <img src={`${iconsPath}/arrow-left.svg`} alt="arrow" />
        Back
      </Link>
    </div>
  )
}

export default FrequentlyAskedQuestion