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
        const q = query(collection(db, 'numbers'), where('userEmail', '==', userEmail))
        const unSubscripe = onSnapshot(q, (querySnapshot) => {
            const numbersArray = []
            querySnapshot.forEach((doc) => {
                numbersArray.push({...doc.data(), id: doc.id})
            })
            setPhoneNumbers(numbersArray)    
        })
        return () => unSubscripe()
    } ,[userEmail])

    const handleWalletAdd = async() => {
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
                const nq = query(collection(db, 'numbers'), where('phone', '==', phone), where('userEmail', '==', userEmail))
                const nSnapshot = await getDocs(nq)
                if(!nSnapshot.empty) {
                    const numberDoc = nSnapshot.docs[0]
                    const numberRef= doc(db, 'numbers', numberDoc.id)
                    const numberData = numberDoc.data()
                    await updateDoc(numberRef, {
                        amount: Number(numberData.amount) + Number(operationVal),
                        withdraw: Number(numberData.withdraw) + Number(operationVal)
                    })
                }
                alert('تم اتمام العملية بنجاح')
                setPhone('')
                setProfit('')
                setOperationVal('')
            }
        }
        

    return(
        <div className={openWallet ? "shadowBox active" : "shadowBox"}>
            <div className="box">
                <button className={styles.closeBtn} onClick={() => setOpenWallet(false)}><IoIosCloseCircle/></button>
                <h2>عملية استلام</h2>
                <div className="boxForm">
                    <div className="inputContainer">
                        <label htmlFor="">ادخل رقم الشريحة : </label>
                    <input type="number" list="numbers" onChange={(e) => setPhone(e.target.value)} placeholder="ابحث عن رقم المحفظة"/>
                    <datalist id="numbers">
                        {phoneNumbers.map(phoneNumber => {
                            return(
                                <option key={phoneNumber.id} value={phoneNumber.phone}/>
                            )
                        })}
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