import styles from './styles.module.css'
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import useWindowSize from '../../hooks/useWindowSize';

interface Props {
    categories: Category[];
    category: Category | null;
    onClickFn: (category: Category) => void;
}

const sizes = [
    [1190, 10],
    [990, 8],
    [300, 3]
]

const Categories = ({ categories, category, onClickFn }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [maxCategories, setMaxCategories] = useState(10)
    const [overflow, setOverflow] = useState({ left: false, right: false })
    const view = useWindowSize()

    useEffect(() => {
        for (const item of sizes) {
            if (view.width >= item[0]) {
                setMaxCategories(item[1])
                break
            }
        }
    }, [view.width])

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

    if (!categories.length) {
        return (
            <div className={styles.container}>
                {Array(maxCategories).fill(0).map((_, index) => (
                    <button id={`category-skeleton-${index}`} className={`${styles.category} ${styles.skeleton}`} key={index}></button>
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
                        &#8249;
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
                        &#8250;
                    </button>
                </>
            ) : null}
        </div>
    );
};

export default Categories;
