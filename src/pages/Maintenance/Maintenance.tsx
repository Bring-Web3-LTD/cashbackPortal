import styles from './styles.module.css'

const Maintenance = () => {
    return (
        <div className={styles.container}>
            <svg width={100} viewBox="0 0 30 30" id="Layer_1" version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                fill="var(--title-f-c)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g strokeLinecap="round" strokeLinejoin="round"></g><g ><style type="text/css"></style><path className="st8" d="M6,9.3L3.9,5.8l1.4-1.4l3.5,2.1v1.4l3.6,3.6c0,0.1,0,0.2,0,0.3L11.1,13L7.4,9.3H6z M21,17.8c-0.3,0-0.5,0-0.8,0 c0,0,0,0,0,0c-0.7,0-1.3-0.1-1.9-0.2l-2.1,2.4l4.7,5.3c1.1,1.2,3,1.3,4.1,0.1c1.2-1.2,1.1-3-0.1-4.1L21,17.8z M24.4,14 c1.6-1.6,2.1-4,1.5-6.1c-0.1-0.4-0.6-0.5-0.8-0.2l-3.5,3.5l-2.8-2.8l3.5-3.5c0.3-0.3,0.2-0.7-0.2-0.8C20,3.4,17.6,3.9,16,5.6 c-1.8,1.8-2.2,4.6-1.2,6.8l-10,8.9c-1.2,1.1-1.3,3-0.1,4.1l0,0c1.2,1.2,3,1.1,4.1-0.1l8.9-10C19.9,16.3,22.6,15.9,24.4,14z"></path></g></svg>
            <h1 className={styles.title}>
                This page is currently under maintenance.<br />Please check back later.
            </h1>
        </div>
    )
}

export default Maintenance