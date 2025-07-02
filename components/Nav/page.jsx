"use client";
import styles from "./style.module.css";
import Link from "next/link";
import { FaArrowUp } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";
import { RiHome5Line } from "react-icons/ri";
import { FaGear } from "react-icons/fa6";
import { FaCameraRetro } from "react-icons/fa";
import { useEffect, useState } from "react";

function Nav() {
    const [userEmail, setUserEmail] = useState('') 

    useEffect(() => {
        if(typeof window !== 'undefined') {
            setUserEmail(localStorage.getItem('email'))
        }
    }, [])

    return(
        <nav className={styles.nav}>
            <Link href={"/reports"} className={styles.navLink}>
                <span><TbReportSearch/></span>
                <span>التقارير</span>
            </Link>
            {userEmail === 'mahmoudhisham@gmail.com' ?             
            <Link href={"/image"} className={styles.navLink}>
                <span><FaCameraRetro/></span>
                <span>الصور</span>
            </Link>:""}
            <Link href={"/sittings"} className={styles.navLink}>
                <span><FaGear/></span>
                <span>الاعدادات</span>
            </Link>
        </nav>
    )
}

export default Nav;