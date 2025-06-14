'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useState } from "react";
import { IoIosArrowDropleftCircle } from "react-icons/io";
import QRCode from "react-qr-code";

function Numbers() {
    const [phone, setPhone] = useState('')

    return(
        <div className="main">
            <div className={styles.numbersContainer}>
                <div className="title">
                    <h2>الارقام و الليمت</h2>
                    <Link href={"/"} className="titleLink"><IoIosArrowDropleftCircle /></Link>
                </div>
                <div className={styles.container}>
                    <div className={styles.boxContainer}>
                        <div className={styles.box}>
                            <p>اضف رقم المحفظة</p>
                            <div className={styles.inputDiv}>
                                <input type="number" placeholder="اضف رقم المحفظة" onChange={(e) => setPhone(e.target.value)}/>
                            </div>
                        </div>
                    </div>
                    <div className={styles.content}>
                        {phone !== '' ? <QRCode value={phone} size={200} /> : ""}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Numbers;