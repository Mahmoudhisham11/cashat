"use client";
import styles from "./styles.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { db } from "../firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

function Login() {
    const [active,setActive] = useState(true)
    const [userName, setUserName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    const handleAdd = async() => {
        if(userName !== "" && email !== "" && password !== "") {
            const userRef = collection(db, 'users')
            const q = query(userRef, where('email', '==', email))
            const querySnapshot = await getDocs(q)
            if(querySnapshot.empty) {
                await addDoc(userRef, {userName, email, password})
                alert("A new account has been created")
                setUserName('')
                setEmail('')
                setPassword('')
                setActive(true)
            }else {
                alert("The user already has an account")
                setUserName('')
                setEmail('')
                setPassword('')
            }
        }
    }

    const handleLogin = async() => {
        const q = query(collection(db, 'users'), where('email', '==', email))
        const querySnapshot = await getDocs(q)
        if(querySnapshot.empty) {
            alert("Email is not valid")
        }else {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            if(userData.password !== password) {
                alert("Password is not valid")
            }else {
                if(typeof window !== "undefined") {
                    localStorage.setItem('email', userData.email)
                    localStorage.setItem('userName', userData.userName)
                }
                router.push('/main')
            }
        }
    }

    return(
        <div className="main">
            <div className={styles.loginContainer}>
                <div className={styles.linkContainer}>
                    <Link href={"/"} className={styles.link}><FaArrowLeft/></Link>
                </div>
                <div className={styles.title}>
                    <h2>Go ahead and setup <br /> your account</h2>
                    <p>sign in-up to enjoy the best experience</p>
                </div>
                <div className={styles.accountMange}>
                    <div className={styles.btnContainer}>
                        <button onClick={() =>  setActive(true)} className={active ? `${styles.active}` : ""}>Sign in</button>
                        <button onClick={() => setActive(false)} className={active ? "" : `${styles.active}`}>Register</button>
                    </div>
                    <div className={active ? `${styles.loginContent}` : `${styles.loginContent} ${styles.close}`}>
                        <div className={styles.form}>
                            <div className="inputContainer">
                                <label htmlFor="">Email :</label>
                                <input type="text" value={email}  onChange={(e) => setEmail(e.target.value)}/>
                            </div>
                            <div className="inputContainer">
                                <label htmlFor="">password :</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                            </div>
                            <button onClick={handleLogin}>Sing in</button>
                        </div>
                    </div>
                    <div className={active ? `${styles.create}` : `${styles.create} ${styles.open}`}>
                        <div className={styles.form}>
                            <div className="inputContainer">
                                <label htmlFor="">Name :</label>
                                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}/>
                            </div>
                            <div className="inputContainer">
                                <label htmlFor="">Email :</label>
                                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="inputContainer">
                                <label htmlFor="">password :</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button onClick={handleAdd}>Register</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;