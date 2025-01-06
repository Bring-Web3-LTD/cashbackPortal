import Modal from "../../Modal/Modal"

interface Props {
    open: boolean
    closeFn: () => void
}

const DemoModal = ({ open, closeFn }: Props) => {
    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            <h2 style={{ textAlign: 'center' }}>This is a demo, you can't claim your rewards</h2>
        </Modal>
    )
}

export default DemoModal;