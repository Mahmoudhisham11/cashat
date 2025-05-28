'use clietn';
import styles from './styles.module.css';
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../../app/firebase";
import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from 'react';

function WalletPop({openWallet, setOpenWallet}) {
    const [walletVal, setWalletVal] = useState('')
    const [userEmail, setUserEmail] = useState('')
    useEffect(() => {
        if(typeof window !== 'undefined') {
            const storageEmail = localStorage.getItem('email')
            if(storageEmail) {
                setUserEmail(storageEmail)
            }
        }
        
    }, [])

    const handleUpdateWallet = async() => {
        const q = query(collection(db, 'users'), where('email', '==', userEmail))
        const querySnapshot = await getDocs(q)
        if(!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userRef = doc(db, 'users', userDoc.id)
            await updateDoc(userRef, {wallet: walletVal})
            alert("تم تعديل قيمة المحفطة")
            setWalletVal('')
        }
    }

    return(
        <div className={openWallet ? "shadowBox active" : "shadowBox"}>
            <div className="box">
                <button className={styles.closeBtn} onClick={() => setOpenWallet(false)}><IoIosCloseCircle/></button>
                <h2>تعديل قيمة المحفظة</h2>
                <div className="boxForm">
                    <div className="inputContainer">
                        <label htmlFor="">قيمة المحفظة : </label>
                        <input type="number" value={walletVal} placeholder="عدل قيمة المحفظة" onChange={(e) => setWalletVal(e.target.value)}/>
                    </div>
                    <button className={styles.walletBtn} onClick={handleUpdateWallet}>اكمل العملية</button>
                </div>
            </div>
        </div>
    )
}

export default WalletPop;