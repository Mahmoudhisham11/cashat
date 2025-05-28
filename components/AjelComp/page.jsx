'use client';
import { useState } from "react";
import styles from "./styles.module.css";
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../../app/firebase";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

function AjelComp({openAjel, setOpenAjel}) {
    const [phone, setPhone] = useState('')
    const [userName, setUserName] = useState('')
    const [ajelVal, setAjelVal] = useState('')
    const [profit, setProfit] = useState('')
    const [userEmail, setUserEmail] = useState('')

    const handleCashAdd = async() => {
            if(typeof window !== "undefined") {
                const stroageEamil = localStorage.getItem('email')
                if(stroageEamil) {
                    setUserEmail(stroageEamil)
                }
            }
            const q = query(collection(db, 'users'), where('email', '==', userEmail))
            const querySnapshot = await getDocs(q)
            if(!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0]
                const userData = userDoc.data()
                const userRef = doc(db, 'users', userDoc.id)
                await addDoc(collection(db, 'ajel'), {
                    userName,
                    phone,
                    userEmail,
                    profit,
                    ajelVal,
                })
                await updateDoc(userRef, {
                    wallet: Number(userData.wallet) - Number(ajelVal)
                })
                alert('تم اتمام العملية بنجاح')
                setUserName('')
                setPhone('')
                setProfit('')
                setAjelVal('')
            }
        }

    return(
        <div className={openAjel ? "shadowBox active" : "shadowBox"}>
            <div className="box">
                <button className={styles.closeBtn} onClick={() => setOpenAjel(false)}><IoIosCloseCircle/></button>
                <h2>الاجل</h2>
                <div className="boxForm">
                    <div className="inputContainer">
                        <label htmlFor="">رقم الخط</label>
                        <input type="number" value={phone} placeholder="ادخل رقم الخط المستخدمة" onChange={(e) => setPhone(e.target.value)}/>
                    </div>
                    <div className="inputContainer">
                        <label htmlFor="">اسم العميل</label>
                        <input type="text" value={userName} placeholder="ادخل اسم العميل" onChange={(e) => setUserName(e.target.value)}/>
                    </div>
                    <div className="inputContainer">
                        <label htmlFor="">قيمة الاجل : </label>
                        <input type="number" value={ajelVal} placeholder="ادخل قيمة العميلة" onChange={(e) => setAjelVal(e.target.value)}/>
                    </div>
                    <div className="inputContainer">
                        <label htmlFor="">قيمة الربح : </label>
                        <input type="number" value={profit} placeholder="ادخل قيمة الربح" onChange={(e) => setProfit(e.target.value)}/>
                    </div>
                    <button className={styles.walletBtn} onClick={handleCashAdd}>اكمل العملية</button>
                </div>
            </div>
        </div>
    )
}

export default AjelComp;