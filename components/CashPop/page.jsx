'use client';
import styles from "./styles.module.css";
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../../app/firebase";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useState, useEffect } from "react";

function CashPop({openCash, setOpenCash}) {
    const [cashVal, setCashVal] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    useEffect(() => {
        if(typeof window !== 'undefined') {
            const storageEmail = localStorage.getItem('email')
            if(storageEmail) {
                setUserEmail(storageEmail)
            }
        }
    }, [])

    const handleUpdateCash = async() => {
        const q = query(collection(db, 'users'), where('email', '==', userEmail))
        const querySnapshot = await getDocs(q)
        if(!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userRef = doc(db, 'users', userDoc.id)
            await updateDoc(userRef, {cash: cashVal})
            alert("تم تعديل قيمة المحفطة")
            setCashVal('')
        }
    }
    
    return(
        <div className={openCash ? "shadowBox active" : "shadowBox"}>
            <div className="box">
                <button className={styles.closeBtn} onClick={() => setOpenCash(false)}><IoIosCloseCircle/></button>
                <h2>تعديل قيمة النقدي</h2>
                <div className="boxForm">
                    <div className="inputContainer">
                        <label htmlFor="">قيمة النقدي : </label>
                        <input type="number" value={cashVal} placeholder="تعديل قيمة النقدي" onChange={(e) => setCashVal(e.target.value)}/>
                    </div>
                    <button className={styles.walletBtn} onClick={handleUpdateCash}>اكمل العملية</button>
                </div>
            </div>
        </div>
    )
}

export default CashPop;