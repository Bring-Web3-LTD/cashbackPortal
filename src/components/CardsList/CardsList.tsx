import styles from './styles.module.css'
import RetailerCard from '../RetailerCard/RetailerCard'

const CardsList = () => {
    return (
        <div className={styles.container}>
            {Array(25).fill(0).map((_, index) =>
                <RetailerCard key={index} />
            )}
        </div>
    )
}

export default CardsList