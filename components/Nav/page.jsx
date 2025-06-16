"use client";
import styles from "./style.module.css";
import Link from "next/link";
import { GoHistory } from "react-icons/go";
import { FaArrowUp } from "react-icons/fa";
import { FaArrowDown } from "react-icons/fa";
import { TbZoomMoneyFilled } from "react-icons/tb";
import { RiHome5Line } from "react-icons/ri";
import { FaGear } from "react-icons/fa6";

function Nav() {
    return(
        <nav className={styles.nav}>
            <Link href={"/withdraw"} className={styles.navLink}>
                <span><FaArrowDown/></span>
                <span>تقارير الارسال</span>
            </Link>
            <Link href={"/"} className={styles.navLink}>
                <span><RiHome5Line/></span>
                <span>الرئيسية</span>
            </Link>
            <Link href={"/deposit"} className={styles.navLink}>
                <span><FaArrowUp/></span>
                <span>تقارير الاستلام</span>
            </Link>
            <Link href={"/sittings"} className={styles.navLink}>
                <span><FaGear/></span>
                <span>الاعدادات</span>
            </Link>
        </nav>
    )
}

export default Nav;