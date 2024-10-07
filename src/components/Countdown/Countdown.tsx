import styles from './styles.module.css'
import { useEffect, useState } from "react"

interface Props {
    isRunning: boolean
    setIsRunning: (bool: boolean) => void
}

const CountDown = ({ isRunning, setIsRunning }: Props): JSX.Element => {
    const totalTime = 5 * 60
    const [seconds, setSeconds] = useState(totalTime)
    const timePassed = Math.abs((seconds / totalTime) * 100 - 100)

    useEffect(() => {
        let intervalId: NodeJS.Timeout

        if (isRunning && seconds > 0) {
            intervalId = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds - 1)
            }, 1000)
        } else if (seconds === 0) {
            setIsRunning(false)
        }

        return () => clearInterval(intervalId)
    }, [isRunning, seconds, setIsRunning])

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
    }

    return (
        <div className={styles.container}>
            <div
                className={styles.progress_bar}
                style={{ width: `${timePassed}%` }}
            />
            {formatTime(seconds)}
        </div>
    )
}

export default CountDown;