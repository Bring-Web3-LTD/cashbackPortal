import styles from './styles.module.css'
import { useRef } from 'react';
import { useSwipeable } from 'react-swipeable';

interface Props {
    categories: Category[];
    category: Category | null;
    onClickFn: (category: Category) => void;
}

const Categories = ({ categories, category, onClickFn }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);

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

    if (categories.length <= 10) {
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
