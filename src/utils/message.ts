import { STANDALONE } from "../config"

interface Message {
    [key: string]: string | number | boolean
}

const message = (message: Message) => {
    // Standalone mode has no host page: window.parent is the portal itself
    if (STANDALONE) return
    window.parent.postMessage({
        ...message,
        from: 'bringweb3',
    }, '*')
}

export default message;