"use client";
import styles from "./styles.module.css";
import Link from "next/link";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

function Login() {
    const [active,setActive] = useState(true)
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
                            <input type="text" />
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">password :</label>
                            <input type="password" />
                        </div>
                        <button>Sing in</button>
                    </div>
                </div>
                <div className={active ? `${styles.create}` : `${styles.create} ${styles.open}`}>
                    <div className={styles.form}>
                        <div className="inputContainer">
                            <label htmlFor="">Name :</label>
                            <input type="text" />
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">Email :</label>
                            <input type="text" />
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">password :</label>
                            <input type="password" />
                        </div>
                        <button>Register</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;