interface Message {
    [key: string]: string | number | boolean
}

const message = (message: Message) => {
    window.parent.postMessage({
        ...message,
        from: 'bringweb3',
    }, '*')
}

export default message;