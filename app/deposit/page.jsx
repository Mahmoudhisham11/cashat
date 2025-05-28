'use client';
import styles from "./styles.module.css";
import { IoIosArrowDropleftCircle } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

function Deposit() {
    const [active, setActive] = useState('')
    const [cashArray, setCashArray] = useState([])
    const [userEmail, setUserEmail] = useState('')
    const [total, setTotal] = useState(0)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storageEmail = localStorage.getItem('email')
            if (storageEmail) {
                setUserEmail(storageEmail)
            }
        }
        const q = query(collection(db, 'operations'), where('type', '==', 'ايداع'), where('userEmail', '==', userEmail))
        const unSubscribe = onSnapshot(q, (querySnapshot) => {
            const snapArray = []
            querySnapshot.forEach((doc) => {
                snapArray.push({...doc.data(), id: doc.id})
            })
            setCashArray(snapArray)
        })
        const subTotal = cashArray.reduce((acc, cash) => {
            return acc + Number(cash.operationVal)
        }, 0)
        setTotal(subTotal)
        return () => unSubscribe()

    }, [userEmail,cashArray])

    return(
        <div className="main">
            <div className={styles.withdrawContainer}>
                <div className="title">
                    <h2>سجل الايداع</h2>
                    <Link href={"/"} className="titleLink"><IoIosArrowDropleftCircle /></Link>
                </div>
                <div className={styles.container}>
                    <div className={styles.containerTitle}>
                        <h2>اجمالي الايداع : {total} جنية</h2>
                    </div>
                    <div className={styles.content}>
                        {cashArray.map((cash, index) => {
                            return (
                                <div className={active === index ? `${styles.card} ${styles.active}` : `${styles.card}`} key={cash} onClick={() => setActive(active === index ? null : index)}>
                                    <div className={styles.cardHead}>
                                        <h2>عملية ايداع</h2>
                                        <h2><IoIosArrowDown /></h2>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <p>
                                            <span>قيمة الايداع : </span>
                                            <strong>{cash.operationVal} جنية</strong>
                                        </p>
                                        <p>
                                            <span>قيمة الربح : </span>
                                            <strong>{cash.profit} جنية</strong>
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Deposit;