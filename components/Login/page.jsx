"use client";
import { useState } from "react";
import styles from "./styles.module.css";
import {db} from "../../app/firebase"
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";

function Login() {
    const [acitve, setActive] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [cash, setChash] = useState('')

    // CREATE NEW ACCOUNT
    const handleCreatAcc = async() => {
        if(name !== "" && email !== "" && password !== "" && cash !== "") {
            const userRef = collection(db, "users")
            const q = query(userRef, where("email", "==", email))
            const querySnapshot = await getDocs(q)
            if(querySnapshot.empty) {
                await addDoc(userRef, {
                    name, 
                    email, 
                    password, 
                    cash,
                    isSubscribed: false,
                    date: serverTimestamp()
                })
                alert('تم انشاء حساب جديد')
                setName('')
                setEmail('')
                setPassword('')
                setChash('')
            }else {
                alert("المستخدم موجود بالفعل")
                setName('')
                setEmail('')
                setPassword('')
                setChash('')
            }
        }
    }
    // CHECK ACCOUNT AND LOGIN
    const handleLogin = async() => {
        const userRef = collection(db, "users")
        const q = query(userRef, where("email", '==', email))
        const querySnapshot = await getDocs(q) 
        if(querySnapshot.empty) {
            alert("يوجد مشكلة في البريد الالكتروني")
        }else {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            if(userData.password !== password) {
                alert("يوجد مشكلة في كلمة المرور")
            }else {
                    if(userData.isSubscribed !== true) {
                        alert("انت غير مشترك في التطبيق كلم 01124514331 للاشتراك في التطبيق")
                    }else {
                        if(typeof window !== "undefined") {
                            localStorage.setItem("email", email)
                            localStorage.setItem("name", userData.name)
                        }
                        if(typeof window !== "undefined") {
                            window.location.reload()
                        }
                    }
            }
        }
    }

    return(
        <div className={styles.loginContainer}>
            <div className={styles.title}>
                <h2>مرحبا بعودتك</h2>
                <p>برجاء تسجيل الدخول</p>
            </div>
            <div className={styles.Content}>
                <div className={styles.btnsContainer}>
                    <div className={styles.btns}>
                        <button className={acitve ? `${styles.active}` : ""} onClick={() => setActive(true)}>تسجيل الدخول</button>
                        <button className={acitve ? "" : `${styles.active}`} onClick={() => setActive(false)}>انشاء حساب</button>
                    </div>
                </div>
                {acitve ? 
                    <div className={styles.form}>
                        <div className="inputContainer">
                            <label htmlFor="">البريد الالكتروني : </label>
                            <input type="email" placeholder="ادخل بريدك الالكتروني" onChange={(e) => setEmail(e.target.value)}/>
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">كلمة المرور :</label>
                            <input type="password" placeholder="اخل كلمة المرور الخاصة بك" onChange={(e) => setPassword(e.target.value)}/>
                        </div>
                        <button className={styles.fromBtn} onClick={handleLogin}>تسجيل الدخول</button>
                    </div>
                : 
                    <div className={styles.form}>
                        <div className="inputContainer">
                            <label htmlFor="">اسم المستخدم</label>
                            <input type="text" value={name} placeholder="ادخل اسمك باللغة العربية" onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">البريد الالكتروني : </label>
                            <input type="email" value={email} placeholder="ادخل بريدك الالكتروني" onChange={(e) => setEmail(e.target.value)}/>
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">كلمة المرور :</label>
                            <input type="password" value={password} placeholder="اخل كلمة المرور الخاصة بك" onChange={(e) => setPassword(e.target.value)}/>
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">رصيد الكاش : </label>
                            <input type="text" value={cash} placeholder="اخل الرصيد النقدي" onChange={(e) => setChash(e.target.value)}/>
                        </div>
                        <button className={styles.fromBtn} onClick={handleCreatAcc}>انشاء حساب جديد</button>
                    </div>
                }
            </div>
        </div>
    )
}

export default Login;