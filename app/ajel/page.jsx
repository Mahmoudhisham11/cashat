'use client';
import styles from "./styles.module.css";
import { IoIosArrowDropleftCircle } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { db } from "../firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";

function Ajel() {
    const [active, setActive] = useState(false)
    const [search, setSearch] = useState('')
    const [total, setTotal] = useState(0)
    const [userEmail, setUserEmail] = useState('')
    const [ajelArray, setAjelArray] = useState([])
    const [usersNames, setUsersNames] = useState([])

        useEffect(() => {
        if (typeof window !== "undefined") {
            const storageEmail = localStorage.getItem('email')
            if (storageEmail) {
                setUserEmail(storageEmail)
            }
        }
        let q
        if(search === "") {
            q = query(collection(db, 'ajel'), where('userEmail', '==', userEmail))
        }else {
            q = query(collection(db, 'ajel'), where('userEmail', '==', userEmail), where('userName', '==', search))
        }
        const unSubscribe = onSnapshot(q, (querySnapshot) => {
            const snapArray = []
            const userArray = []
            querySnapshot.forEach((doc) => {
                snapArray.push({...doc.data(), id: doc.id})
                const data = doc.data()
                if(data.userName) {
                    userArray.push(data.userName)
                }
            })
            setAjelArray(snapArray)
            const uniqueUsers = [...new Set(userArray)]
            setUsersNames(uniqueUsers)
        })
        const subTotal = ajelArray.reduce((acc, ajel) => {
            return acc + Number(ajel.ajelVal)
        }, 0)
        setTotal(subTotal)
        return () => unSubscribe()
    }, [userEmail,search,ajelArray])

    const handleAjel = async(id, phone, profit, val) => {
        // ADD THE OPERATION TO WITHDRAW OPERATIONS
        const operationsCollection = collection(db, 'operations')
        await addDoc(operationsCollection, {
            userEmail,
            phone,
            profit,
            operationVal: val,
            type : 'سحب'
        })
        // UPDATE USER WALLET VALUE
        const q = query(collection(db, 'users'), where('email', '==', userEmail))
        const querySnapshot = await getDocs(q)
        if(!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            const userRef = doc(db, 'users', userDoc.id)
            await updateDoc(userRef, {wallet: Number(userData.wallet) + Number(val)})
        }
        // DELETE OPERATION FROM AJEL COLLECTION
        alert('تم تنفيذ العملية بنجاح')
        const delVal = doc(db, 'ajel', id)
        await deleteDoc(delVal)
    }

    return(
        <div className="main">
            <div className={styles.withdrawContainer}>
                <div className="title">
                    <h2>سجل الاجل</h2>
                    <Link href={"/"} className="titleLink"><IoIosArrowDropleftCircle /></Link>
                </div>
                <div className={styles.inputContainer}>
                    <div className={styles.inputBox}>
                        <input list="userName" placeholder="ابحث عن اسم العميل" onChange={(e) => setSearch(e.target.value)} />
                        <datalist id="userName">
                            {usersNames.map((userName, index) => {
                                return (
                                    <option key={index} value={userName}/>
                                )
                            })}
                        </datalist>
                        <p><FaSearch /></p>
                    </div>
                </div>
                <div className={styles.container}>
                    <div className={styles.containerTitle}>
                        <h2>اجمالي الاجل : {total} جنية</h2>
                    </div>
                    <div className={styles.content}>
                        {ajelArray.map((ajel, index) => {
                            return (
                                <div className={active === index ? `${styles.card} ${styles.active}` : `${styles.card}`} key={ajel} onClick={() => setActive(active === index ? null : index)}>
                                    <div className={styles.cardHead}>
                                        <h2>{ajel.userName}</h2>
                                        <h2><IoIosArrowDown /></h2>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <p>
                                            <span>رقم المحفظة : </span>
                                            <strong>{ajel.phone}</strong>
                                        </p>
                                        <p>
                                            <span>قيمة الاجل : </span>
                                            <strong>{ajel.ajelVal} جنية</strong>
                                        </p>
                                        <p>
                                            <span>قيمة الربح : </span>
                                            <strong>{ajel.profit} جنية</strong>
                                        </p>
                                    </div>
                                    <button className={styles.completeBtn} onClick={() => handleAjel(ajel.id, ajel.phone, ajel.profit, ajel.ajelVal)}>تم التحصيل</button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Ajel;