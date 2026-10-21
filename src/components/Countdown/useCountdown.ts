/**
 * Logic hook for the five-minute countdown. Owns the tick, the formatted
 * clock and the elapsed percentage the bar is drawn from — so the view is
 * pure UI.
 */
import { useEffect, useState } from 'react'

const TOTAL_TIME = 5 * 60

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
}

interface Args {
    isRunning: boolean
    setIsRunning: (bool: boolean) => void
}

export const useCountdown = ({ isRunning, setIsRunning }: Args) => {
    const [seconds, setSeconds] = useState(TOTAL_TIME)

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

    return {
        timeLeft: formatTime(seconds),
        timePassed: Math.abs((seconds / TOTAL_TIME) * 100 - 100),
    }
}
