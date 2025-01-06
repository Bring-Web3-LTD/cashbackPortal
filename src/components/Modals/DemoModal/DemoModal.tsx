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
            <h3 style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>This is a demo wallet, you can't claim any rewards</h3>
        </Modal>
    )
}

export default DemoModal;