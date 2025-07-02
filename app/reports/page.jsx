'use client';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { db } from "../firebase";

function Reports() {
    const [reports, setReports] = useState([])
    const [date, setDate] = useState('')
    const [active, setActive] = useState('')
    const [email, setEmail] = useState('')
    const [total, setTotal] = useState(0)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storageEmail = localStorage.getItem('email')
            setEmail(storageEmail)
            const q = query(collection(db, 'reports'), where('date', '==', date), where('userEmail', '==', email))
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const reportsArray = [];
                querySnapshot.forEach((doc) => {
                    reportsArray.push({ ...doc.data(), id: doc.id });
                });
                setReports(reportsArray);
            });
            return () => unsubscribe();
        }
    }, [date]);

    useEffect(() => {
        const subTotal = reports.reduce((acc, report) => {
            return acc + Number(report.commation)
        }, 0)
        setTotal(subTotal)
    }, [reports])


    return(
        <div className="main">
            <div className={styles.reportsContainer}>
                <div className="header">
                    <h2>التقارير</h2>
                    <Link href={"/"} className="headerLink"><MdOutlineKeyboardArrowLeft /></Link>
                </div>
                <div className={styles.inputContainer}>
                        <input type="date" onChange={(e) => setDate(e.target.value)}/>
                </div>
                <div className={styles.content}>
                        <div className={styles.contentTitle}>
                            <h2>اجمالي الارباح : {total} جنية</h2>
                        </div>
                        {reports.map((report, index) => {
                            return(
                                <div className={active === index ? `${styles.card} ${styles.active}` : `${styles.card}`} key={report.id} onClick={() => setActive(active === index ? null : index)}>
                                    <div className={styles.cardHead}>
                                        <h2>{report.phone}</h2>
                                        <h2><IoIosArrowDown /></h2>
                                    </div>
                                    <hr />
                                    <div className={styles.cardBody}>
                                        <p>
                                            <span>نوع العملية : </span>
                                            <strong>{report.type}</strong>
                                        </p>
                                        <p>
                                            <span>المبلغ : </span>
                                            <strong>{report.operationVal} جنية</strong>
                                        </p>
                                        <p>
                                            <span> العمولة : </span>
                                            <strong>{report.commation} جنية</strong>
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>
        </div>
    )
}

export default Reports