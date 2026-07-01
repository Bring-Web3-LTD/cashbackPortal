/**
 * Category tabs row: horizontally scrollable pills + a fixed search button.
 * One category selected at a time (click active to clear). Shows a single
 * placeholder bar while loading.
 */
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/free-mode'
import Icon from '../Icon/Icon'
import { useCategories, CategoriesProps } from './useCategories'
import styles from './styles.mobile.module.css'

const Categories = (props: CategoriesProps) => {
    const { categories, isLoading, onSearchClick } = props
    const { labels, isActive, selectTab, swiperProps } = useCategories(props)

    if (isLoading) {
        return (
            <div className={`${styles.root} ${styles.rootLoading}`} aria-label={labels.categories}>
                <span className={styles.loadingBar} aria-hidden="true" />
            </div>
        )
    }

    return (
        <div className={styles.root} role="tablist" aria-label={labels.categories}>
            <Swiper className={styles.scroller} {...swiperProps}>
                {categories.map((cat) => (
                    <SwiperSlide key={cat.id} className={styles.slide}>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isActive(cat)}
                            className={`${styles.tab} ${isActive(cat) ? styles.tabActive : ''}`}
                            onClick={() => selectTab(cat)}
                        >
                            {cat.name}
                        </button>
                    </SwiperSlide>
                ))}
            </Swiper>

            <span className={styles.fog} aria-hidden="true" />

            <button
                type="button"
                className={styles.searchBtn}
                onClick={onSearchClick}
                aria-label={labels.search}
            >
                <Icon
                    name="magnifying-glass.svg"
                    className={`${styles.searchBtnIcon} ${styles.searchBtnIconDefault}`}
                />
                <Icon
                    name="magnifying-glass-active.svg"
                    className={`${styles.searchBtnIcon} ${styles.searchBtnIconActive}`}
                />
            </button>
        </div>
    )
}

export default Categories
