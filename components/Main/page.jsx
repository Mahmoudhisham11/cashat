'use client';
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { HiBars3BottomLeft } from "react-icons/hi2";
import { FaArrowUp } from "react-icons/fa";
import { FaArrowDown } from "react-icons/fa";
import { TbZoomMoneyFilled } from "react-icons/tb";
import SliderCards from "../SliderCards/page";
import Nav from "../Nav/page";
import Wallet from "../Wallet/page"
import Cash from "../Cash/page"
import AjelComp from "../AjelComp/page"
import { db } from "../../app/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

function Main() {
    const [openWallet, setOpenWallet] = useState(false)
    const [openCash, setOpenCash] = useState(false)
    const [openAjel, setOpenAjel] = useState(false)
    const [userName, setUesrName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [cash, setCash] = useState('')
    const [wallet, setWallet] = useState('')
    const [total, setTotal] = useState('')

    useEffect(() => {
        if(typeof window !== "undefined") {
            const storageName = localStorage.getItem("name")
            const storageEmail = localStorage.getItem("email")
            if(storageName) {
                setUesrName(storageName)
                setUserEmail(storageEmail)
            }
        }
        const q = query(collection(db, 'users'), where('email', '==', userEmail))
        const userSubscribe = onSnapshot(q, (querySanpshot) => {
            const dataDoc = querySanpshot.docs[0]
            const data = dataDoc.data()
            setWallet(data.wallet)
            setCash(data.cash)
            setTotal(Number(data.cash) + Number(data.wallet))
        })
        return () => userSubscribe()
    }, [userName,userEmail])

    return(
        <div className={styles.main}>
            <Nav/>
            <Wallet openWallet={openWallet} setOpenWallet={setOpenWallet} />
            <Cash openCash={openCash} setOpenCash={setOpenCash}/>
            <AjelComp openAjel={openAjel} setOpenAjel={setOpenAjel}/>
            <div className={styles.title}>
                <div className={styles.text}>
                    <p>مرحبا بعودتك</p>
                    <h2>{userName}</h2>
                </div>
                <button><HiBars3BottomLeft/></button>
            </div>
            <div className={styles.container}>
                <div className={styles.cardContainer}>
                    <div className={styles.headerCard}>
                        <div className={styles.top}>
                            <p>رائس المال</p>
                            <strong>{total} جنية</strong>
                        </div>
                        <div className={styles.btsContainer}>
                            <div className={styles.btnsContent}>
                                <button onClick={() => setOpenWallet(true)}><FaArrowDown/></button>
                                <p>سحب</p>
                            </div>
                            <div className={styles.btnsContent}>
                                <button onClick={() => setOpenCash(true)}><FaArrowUp/></button>
                                <p>ايداع</p>
                            </div>
                            <div className={styles.btnsContent}>
                                <button onClick={() => setOpenAjel(true)}><TbZoomMoneyFilled/></button>
                                <p>الاجل</p>
                            </div>
                        </div>
                    </div>
                </div>
                <SliderCards wallet={wallet} cash={cash}/>
            </div>
        </div>
    )
}

export default Main;