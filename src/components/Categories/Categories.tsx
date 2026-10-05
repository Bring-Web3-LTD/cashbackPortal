/**
 * Desktop categories row: a horizontally scrolling pill list with fade veils
 * and arrows at whichever end still has content.
 * Pure UI — logic in useCategoriesDesktop.
 */
import styles from './styles.module.css'
import Icon from '../Icon/Icon'
import { useCategoriesDesktop } from './useCategoriesDesktop'

interface Props {
    categories: Category[];
    category: Category | null;
    onClickFn: (category: Category) => void;
}

const Categories = ({ categories, category, onClickFn }: Props) => {
    const {
        showSkeleton,
        skeletonCount,
        scrollRef,
        overflow,
        measure,
        scrollLeft,
        scrollRight,
        swipeHandlers,
        labels,
    } = useCategoriesDesktop(categories)

    if (showSkeleton) {
        return (
            <div className={`${styles.container} ${styles.skeleton_row}`}>
                {Array(skeletonCount).fill(0).map((_, index) => (
                    <button id={`category-skeleton-${index}`} className={`${styles.category} ${styles.skeleton} skeleton_shimmer`} key={index}></button>
                ))}
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div
                id="categories-scrollable"
                className={styles.categories}
                {...swipeHandlers}
                ref={scrollRef}
                onScroll={measure}
            >
                {categories.map(cat => (
                    <button
                        id={`category-scroll-${cat.name}`}
                        onClick={() => onClickFn(cat)}
                        key={cat.id}
                        className={`${styles.category} ${cat === category ? styles.selected : ''}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            {overflow.left ? (
                <>
                    <div className={`${styles.veil} ${styles.veil_left}`} />
                    <button
                        id="categories-arrow-left"
                        className={`${styles.arrow} ${styles.arrow_left}`}
                        aria-label={labels.scrollLeft}
                        onClick={scrollLeft}
                    >
                        <Icon className={styles.arrow_icon} name="chevron-left.svg" alt="" />
                    </button>
                </>
            ) : null}
            {overflow.right ? (
                <>
                    <div className={`${styles.veil} ${styles.veil_right}`} />
                    <button
                        id="categories-arrow-right"
                        className={`${styles.arrow} ${styles.arrow_right}`}
                        aria-label={labels.scrollRight}
                        onClick={scrollRight}
                    >
                        <Icon className={styles.arrow_icon} name="chevron-right.svg" alt="" />
                    </button>
                </>
            ) : null}
        </div>
    );
};

export default Categories;
