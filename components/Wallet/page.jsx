'use client';
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../../app/firebase";
import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";

function Wallet({openWallet, setOpenWallet}) {
    const [phone, setPhone] = useState('')
    const [operationVal, setOperationVal] = useState('')
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

    const handleWalletAdd = async() => {
        const isExisting = phoneNumbers.includes(phone)
        if(!isExisting && phoneNumbers.length >= 25) {
            alert("لقد وصلت للحد الاقصى لعدد الشرائح")
        }else {
            const q = query(collection(db, 'users'), where('email', '==', userEmail))
            const querySnapshot = await getDocs(q)
            if(!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0]
                const userData = userDoc.data()
                const userRef = doc(db, 'users', userDoc.id)
                await addDoc(collection(db, 'operations'), {
                    phone,
                    userEmail,
                    profit,
                    operationVal,
                    type: 'سحب',
                })
                await updateDoc(userRef, {
                    wallet: Number(userData.wallet) + Number(operationVal),
                    cash: Number(userData.cash) - Number(operationVal)
                })
                alert('تم اتمام العملية بنجاح')
                setPhone('')
                setProfit('')
                setOperationVal('')
            }
        }
        
    }

    return(
        <div className={openWallet ? "shadowBox active" : "shadowBox"}>
            <div className="box">
                <button className={styles.closeBtn} onClick={() => setOpenWallet(false)}><IoIosCloseCircle/></button>
                <h2>عملية سحب</h2>
                <div className="boxForm">
                    <div className="inputContainer">
                        <label htmlFor="">ادخل رقم الشريحة : </label>
                        <input list="numbersData" value={phone} placeholder="ادخل رقم الشريحة التي ستقوم بالسحب منها" onChange={(e) => setPhone(e.target.value)}/>
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
                    <div className="inputContainer">
                        <label htmlFor="">قيمة السحب : </label>
                        <input value={operationVal} placeholder="ادخل قيمة العميلة" onChange={(e) => setOperationVal(e.target.value)}/>
                    </div>
                    <div className="inputContainer">
                        <label htmlFor="">قيمة الربح : </label>
                        <input type="number" value={profit} placeholder="ادخل قيمة الربح" onChange={(e) => setProfit(e.target.value)}/>
                    </div>
                    <button className={styles.walletBtn} onClick={handleWalletAdd}>اكمل العملية</button>
                </div>
            </div>
        </div>
    )
}

export default Wallet;