"use client";
import { useState } from "react";
import styles from "./styles.module.css"

function Login() {
    const [create, setCreate] = useState(false)
    const [email, setEmail] = useState('')

    const handleLogin = () => {
        if(email !== "") {
            if(typeof window !== "undefined") {
                localStorage.setItem("email", email)
            }
        }else {
            alert("Email is not valide")
        }
    }

    return(
        <div className="main">
            <div className={create ? `${styles.loginContainer} ${styles.close}` : `${styles.loginContainer}`}>
                <div className={styles.title}>
                    <h2>welcome to better me</h2>
                    <p>please login</p>
                </div>
                <div className={styles.lgoinContent}>
                    <div className="inputContainer">
                        <label htmlFor="">email : </label>
                        <input type="text" onChange={(e) => setEmail(e.target.value)}/>
                    </div>
                    <div className="inputContainer">
                        <input type="file"/>
                    </div>
                    <div className="inputContainer">
                        <label htmlFor="">password : </label>
                        <input type="password" />
                    </div>
                    <button onClick={handleLogin} className={styles.loginBtn}>login</button>
                    <button onClick={() => setCreate(true)} className={styles.accBtn}>Do not have account ?</button>
                </div>
            </div>
            <div className={create ? `${styles.createContainer} ${styles.open}` : `${styles.createContainer}`}>
                <div className={styles.title}>
                    <h2>welcome to better me</h2>
                    <p>please signup</p>
                </div>
                <div className={styles.lgoinContent}>
                    <div className="inputContainer">
                        <label htmlFor="">Name : </label>
                        <input type="text" />
                    </div>
                    <div className="inputContainer">
                        <label htmlFor="">email : </label>
                        <input type="text" />
                    </div>
                    <div className="inputContainer">
                        <label htmlFor="">password : </label>
                        <input type="password" />
                    </div>
                    <button onClick={() => setCreate(false)} className={styles.loginBtn}>signup</button>
                    <button onClick={() => setCreate(false)} className={styles.accBtn}>have account ?</button>
                </div>
            </div>
        </div>
    )
}

export default Login;