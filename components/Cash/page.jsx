'use client';
import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../../app/firebase";
import { addDoc, collection, doc, getDocs, query, updateDoc, where, onSnapshot } from "firebase/firestore";

function Cash({openCash, setOpenCash}) {
        const [operationVal, setOperationVal] = useState('')
        const [phone, setPhone] = useState('')
        const [profit, setProfit] = useState('')
        const [userEmail, setUserEmail] = useState('')
        const [phoneNumbers, setPhoneNumbers] = useState([])

        useEffect(() => {
            if(typeof window !== "undefined") {
                const stroageEamil = localStorage.getItem('email')
                if(stroageEamil) {
                    setUserEmail(stroageEamil)
                }
            }
            const q = query(collection(db, 'operations'), where('userEmail', '==', userEmail))
            const unSubscripe = onSnapshot(q, (querySnapshot) => {
                const numbersArray = []
                querySnapshot.forEach((doc) => {
                    const data = doc.data()
                    if(data.phone) {
                        numbersArray.push(data.phone)
                    }
                })
                const uniqueNumbers = [...new Set(numbersArray)]
                setPhoneNumbers(uniqueNumbers)    
            })
            return () => unSubscripe()
        } ,[userEmail])

        const handleCashAdd = async() => {
                const q = query(collection(db, 'users'), where('email', '==', userEmail))
                const querySnapshot = await getDocs(q)
                if(!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0]
                    const userData = userDoc.data()
                    const userRef = doc(db, 'users', userDoc.id)
                    await addDoc(collection(db, 'operations'), {
                        userEmail,
                        profit, 
                        operationVal,
                        phone,
                        type: 'ايداع',
                    })
                    await updateDoc(userRef, {
                        wallet: Number(userData.wallet) - Number(operationVal),
                        cash: Number(userData.cash) + Number(operationVal)
                    })
                    alert('تم اتمام العملية بنجاح')
                    setProfit('')
                    setOperationVal('')
                    setPhone('')
                }
            }

    return(
        <div className={openCash ? "shadowBox active" : "shadowBox"}>
            <div className="box">
                <button className={styles.closeBtn} onClick={() => setOpenCash(false)}><IoIosCloseCircle/></button>
                <h2>عملية ايداع</h2>
                <div className="inputContainer">
                    <label htmlFor="">ادخل رقم الشريحة : </label>
                    <input list="numbersData" value={phone} placeholder="ادخل رقم الشريحة التي ستقوم بالايداع منها" onChange={(e) => setPhone(e.target.value)}/>
                    <datalist id="numbersData">
                        {
                            phoneNumbers.map((phoneNumber, index) => {
                                return(
                                    <option key={index} value={phoneNumber} />
                                )
                            })
                        }
                    </datalist>
                </div>
                <div className="boxForm">
                    <div className="inputContainer">
                        <label htmlFor="">قيمة الايداع : </label>
                        <input type="number" value={operationVal} placeholder="ادخل قيمة العميلة" onChange={(e) => setOperationVal(e.target.value)}/>
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
export default Cash;