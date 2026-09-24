import styles from './styles.module.css'
import Icon from '../Icon/Icon'
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSkeletonPreview } from '../../hooks/useSkeletonPreview';
import { useSwipeable } from 'react-swipeable';
import useWindowSize from '../../hooks/useWindowSize';

interface Props {
    categories: Category[];
    category: Category | null;
    onClickFn: (category: Category) => void;
}

/* Placeholder chips are evenly sized, so their count has to come from the
   width or they stretch: the design draws them ~127 wide at every size. The
   page gutter is 48 / 32 / 20 and the body caps at 1344. */
const SKELETON_CHIP = 127
const SKELETON_GAP = 8

const skeletonChipCount = (viewWidth: number) => {
    const gutter = viewWidth >= 1112 ? 48 : viewWidth >= 840 ? 32 : 20
    const available = Math.min(viewWidth, 1440) - gutter * 2
    const fits = Math.floor((available + SKELETON_GAP) / (SKELETON_CHIP + SKELETON_GAP))
    return Math.max(3, Math.min(10, fits))
}

const Categories = ({ categories, category, onClickFn }: Props) => {
    const skeletonPreview = useSkeletonPreview()
    const scrollRef = useRef<HTMLDivElement>(null);
    const [overflow, setOverflow] = useState({ left: false, right: false })
    const view = useWindowSize()

    // Affordances follow measured overflow, not a category count.
    const measure = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setOverflow({
            left: el.scrollLeft > 1,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
        })
    }, [])

    useEffect(() => {
        measure()
    }, [measure, categories, view.width])

    const scrollLeft = (): void => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -500, behavior: 'smooth' });
        }
    };

    const scrollRight = (): void => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 500, behavior: 'smooth' });
        }
    };

    const handlers = useSwipeable({
        onSwipedLeft: () => scrollRight(),
        onSwipedRight: () => scrollLeft(),
    });

    if (!categories.length || skeletonPreview) {
        return (
            <div className={`${styles.container} ${styles.skeleton_row}`}>
                {Array(skeletonChipCount(view.width)).fill(0).map((_, index) => (
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
                {...handlers}
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
