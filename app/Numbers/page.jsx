'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoIosArrowDropleftCircle } from "react-icons/io";
import { HiQrcode } from "react-icons/hi";
import { FaTrashAlt } from "react-icons/fa";
import { IoReloadOutline } from "react-icons/io5";
import { db } from "../firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import QRCode from "react-qr-code";

function Numbers() {
    const [phone, setPhone] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [qrNumber, setQrNumber] = useState('')
    const [openQr, setOpenQr] = useState(false)
    const [numbers, setNumbers] = useState([])

    useEffect(() => {
        if(typeof window !== "undefined") {
            const storageEmail = localStorage.getItem('email')
            setUserEmail(storageEmail)
        }
        const q = query(collection(db, 'numbers'), where('userEmail', '==', userEmail))
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const numbersSnap = []
            querySnapshot.forEach((doc) => {
                numbersSnap.push({...doc.data(), id: doc.id})
            })
            setNumbers(numbersSnap)
        })
        return () => unsubscribe()
    }, [userEmail])

    const handelAddNumber = async() => {
        if(phone !== "") {
            await addDoc(collection(db, 'numbers'), {
                phone,
                userEmail,
                amount: 0,
                withdraw: 0,
                deposit: 0
            })
            alert('تم اضافة الرقم بنجاح')
            setPhone('')
        }
    }

    const handleDelet = async(id) => {
        await deleteDoc(doc(db, 'numbers', id))
    }
    
    const handleQr = (phone) => {
        setQrNumber(phone)
        setOpenQr(true)
    }
    const handleLimit = async(id, withdraw, deposit) => {
        await updateDoc(doc(db, 'numbers', id), {
            withdraw: 0,
            deposit: 0
        })
        alert('الليمت الحالي 0')
    }

    return(
        <div className="main">
            <div className={openQr ? `${styles.qrContainer} ${styles.active}` : `${styles.qrContainer}`}>
                <button onClick={() => setOpenQr(false)}><IoIosArrowDropleftCircle/></button>
                <QRCode value={qrNumber} size={200} />
                <h2>{qrNumber}</h2>
            </div>
            <div className={styles.numbersContainer}>
                <div className="title">
                    <h2>الارقام و الليمت</h2>
                    <Link href={"/"} className="titleLink"><IoIosArrowDropleftCircle /></Link>
                </div>
                <div className={styles.container}>
                    <div className={styles.boxContainer}>
                        <div className={styles.box}>
                            <p>اضف رقم المحفظة</p>
                            <div className={styles.inputDiv}>
                                <input type="number" value={phone} placeholder="اضف رقم المحفظة" onChange={(e) => setPhone(e.target.value)}/>
                                <button onClick={handelAddNumber}>اضف</button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.content}>
                        {numbers.map(number => {
                            return(
                                <div key={number.id} className={styles.numDiv}>
                                    <div className={styles.divHeader}>
                                        <h2 style={{color: Number(number.withdraw) + Number(number.deposit) >= 50000 ? 'red' : ''}}>{number.phone}</h2>
                                        <div className={styles.btns}>
                                            <button onClick={() => handleQr(number.phone)}><HiQrcode/></button>
                                            <button onClick={() => handleLimit(number.id, number.withdraw, number.deposit,)}><IoReloadOutline/></button>
                                            <button onClick={() => handleDelet(number.id)}><FaTrashAlt/></button>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className={styles.divFooter}>
                                        <strong>قيمة المحفظة : <p>{Number(number.amount) || 0}</p></strong>
                                        <strong>قيمة عمليات الاستلام : <p>{Number(number.withdraw) || 0}</p></strong>
                                        <strong>قيمة عمليات السحب : <p>{Number(number.deposit) || 0}</p></strong>
                                        <strong>قيمة الليمت : 
                                        <p>{Number(number.withdraw || 0) + Number(number.deposit || 0)}</p>
                                        </strong>
                                        <strong>المتبقي على الليمت : 
                                        <p>{60000 - (Number(number.withdraw || 0) + Number(number.deposit || 0))}</p>
                                        </strong>

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

export default Numbers;