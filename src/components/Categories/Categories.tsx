import styles from './styles.module.css'
import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import useWindowSize from '../../utils/hooks/useWindowSize';

interface Props {
    categories: Category[];
    category: Category | null;
    onClickFn: (category: Category) => void;
}

const sizes = [
    [1190, 10],
    [990, 8],
    [300, 6]
]

const Categories = ({ categories, category, onClickFn }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [maxCategories, setMaxCategories] = useState(10)
    const view = useWindowSize()

    useEffect(() => {
        for (const item of sizes) {
            if (view.width >= item[0]) {
                setMaxCategories(item[1])
                break
            }
        }
    }, [view.width])

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
                    <button className={`${styles.category} ${styles.skeleton}`} key={index}></button>
                ))}
            </div>
        )
    }

    if (categories.length <= maxCategories) {
        return (
            <div className={styles.container}>
                {categories.map(cat => (
                    <button
                        onClick={() => onClickFn(cat)}
                        key={cat.id}
                        className={`${styles.category} ${cat === category ? styles.selected : ''}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <button
                className={`${styles.arrow} ${styles.arrow_left}`}
                onClick={scrollLeft}
            >
                &#8249;
            </button>
            <div
                className={styles.categories}
                {...handlers}
                ref={scrollRef}
            >
                {categories.map(cat => (
                    <button
                        onClick={() => onClickFn(cat)}
                        key={cat.id}
                        className={`${styles.category} ${cat === category ? styles.selected : ''}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            <button
                className={`${styles.arrow} ${styles.arrow_right}`}
                onClick={scrollRight}
            >
                &#8250;
            </button>
        </div>
    );
};

export default Categories;
