import { v4 } from "uuid"

const getUserId = (platform: string): string => {
    const key = `bring_${platform}_id`
    let userId = ''

    userId = localStorage.getItem(key) || ''

    if (!userId.length) {
        userId = v4()
        localStorage.setItem(key, userId)
    }

    return userId;
}

export default getUserId;