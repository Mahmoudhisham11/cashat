"use client";
import styles from "./styles.module.css";
import { IoMdHome } from "react-icons/io";
import { BiLogOutCircle } from "react-icons/bi";
import { FaPlusSquare } from "react-icons/fa";
import Link from "next/link";

function Nav({add, setAdd}) {

    const handleLogout = () => {
        if(typeof window !== 'undefined') {
            localStorage.clear()
        }
    }

    return(
        <div className={styles.nav}>
            <Link href={"/main"} className={styles.navLinks}><IoMdHome/></Link>
            <button className={styles.addLink} onClick={() => setAdd(true)}><FaPlusSquare/></button>
            <Link href={"/"} onClick={handleLogout} className={styles.navLinks}><BiLogOutCircle/></Link>
        </div>
    )
}
export default Nav;