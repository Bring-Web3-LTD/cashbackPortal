/**
 * Five-minute countdown with a progress bar behind the clock.
 * Pure UI — logic in useCountdown.
 */
import styles from './styles.module.css'
import { useCountdown } from './useCountdown'

interface Props {
    isRunning: boolean
    setIsRunning: (bool: boolean) => void
}

const CountDown = ({ isRunning, setIsRunning }: Props): JSX.Element => {
    const { timeLeft, timePassed } = useCountdown({ isRunning, setIsRunning })

    return (
        <div id="countdown-container" className={styles.container}>
            <div
                id="countdown-progress-bar"
                className={styles.progress_bar}
                style={{ width: `${timePassed}%` }}
            />
            {timeLeft}
        </div>
    )
}

export default CountDown;
