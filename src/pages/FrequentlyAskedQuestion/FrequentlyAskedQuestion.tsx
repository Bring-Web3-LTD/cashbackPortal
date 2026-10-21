import { FC } from 'react'
import styles from './styles.module.css'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon/Icon'
import Dashboard from '../../components/Dashboard/Dashboard'
import { useFaqDesktop, SKELETON_ROWS } from './useFaqDesktop'

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

const FrequentlyAskedQuestion = () => {
  const {
    faq,
    indentationMark,
    showSkeleton,
    isOpen,
    toggle,
    goToView,
    goBack,
    labels,
  } = useFaqDesktop()

  return (
    <div className={styles.container}>
      <main className={styles.main}>
      {/* Same row as the home page; switching view leaves for it. */}
      <Dashboard
        view="cashback"
        onViewChange={goToView}
      />
      <div className={styles.toolbar}>
      <Link
        id="faq-back-btn"
        className={styles.back_btn}
        to={'..'}
        onClick={e => { e.preventDefault(); goBack() }}
      >
        <span className={styles.back_icon}>
          <Icon name="arrow-left.svg" alt="" />
        </span>
        <span className={styles.back_btn_text}>
          {labels.back}
        </span>
      </Link>
        <h1 className={styles.title}>{labels.title}</h1>
      </div>
      <div className={styles.faq_container}>
        {
          showSkeleton ? SKELETON_ROWS.map(i => (
            <div key={i} className={`${styles.collapsible} ${styles.skeleton_row}`} aria-hidden="true">
              <div className={styles.text_col}>
                <span className={`${styles.skeleton_bar} skeleton_shimmer`} />
              </div>
            </div>
          )) : faq?.map(item => (
            <div
              id={`faq-item-${item.id}`}
              key={item.question + item.id}
              className={styles.collapsible}
            >
              <div className={styles.text_col}>
                <button
                  type="button"
                  className={styles.question}
                  aria-expanded={isOpen(item.id)}
                  aria-controls={`faq-answer-${item.id}`}
                  onClick={() => toggle(item.id)}
                >
                  {item.question}
                </button>
                {isOpen(item.id) && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className={styles.answer_container}
                  >
                    <AnswerParser
                      answer={item.answer}
                      links={item.links || []}
                      indentationMark={indentationMark ?? ''}
                    />
                  </div>
                )}
              </div>
              {/* Mouse shortcut for the question button above, which is the
                  keyboard and screen-reader control; one tab stop per row. */}
              <div className={styles.content_cell}>
                <button
                  id={`faq-details-btn-${item.id}`}
                  className={`${styles.details_btn} ${isOpen(item.id) ? styles.rotate : ''}`}
                  onClick={() => toggle(item.id)}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Icon name="arrow-down.svg" alt="" />
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