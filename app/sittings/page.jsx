'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoIosArrowDropleftCircle } from "react-icons/io";
import { IoPerson } from "react-icons/io5";
import { FaWallet } from "react-icons/fa6";
import { GiMoneyStack } from "react-icons/gi";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { RiLogoutCircleLine } from "react-icons/ri";
import { BiSolidPhoneCall } from "react-icons/bi";
import { BsPersonVideo2 } from "react-icons/bs";
import { useRouter } from "next/navigation";
import WalletPop from "../../components/walletPop/page"
import CashPop from "../../components/CashPop/page"
import Developer from "../../components/Developer/page"

function Sittings() {
    const router = useRouter()
    const [openWallet, setOpenWallet] = useState(false)
    const [openCash, setOpenCash] = useState(false)
    const [openDev, setOpenDev] = useState(false)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        if(typeof window !== 'undefined') {
            const storageName = localStorage.getItem('name')
            if(storageName) {
                setUserName(storageName)
            }
        }
    }, [])

    const handleLogout = () => {
        if(typeof window !== 'undefined') {
            localStorage.clear()
            router.push('/')
        }
    }

    return(
        <div className="main">
            <WalletPop openWallet={openWallet} setOpenWallet={setOpenWallet}/>
            <Developer openDev={openDev} setOpenDev={setOpenDev}/>
            <CashPop openCash={openCash} setOpenCash={setOpenCash} />
            <div className={styles.sittingsContainer}>
                <div className="title">
                    <Link href={"/"} className="titleLink"><IoIosArrowDropleftCircle/></Link>
                    <h2>الاعدادات</h2>
                </div>
                <div className={styles.container}>
                    <div className={styles.boxContainer}>
                        <div className={styles.box}>
                            <h2>{userName}</h2>
                        </div>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.accContainer}>
                            <h2>تفاصيل الملف الشخصي</h2>
                            <div className={styles.btnsContainer}>
                                <div className={styles.btnContent}>
                                    <button onClick={() => setOpenWallet(true)}>
                                        <span><FaWallet/></span>
                                        <span>تعديل المحفظة</span>
                                    </button>
                                    <p><MdKeyboardArrowLeft/></p>
                                </div>
                                <div className={styles.btnContent}>
                                    <button onClick={() => setOpenCash(true)}>
                                        <span><GiMoneyStack/></span>
                                        <span>تعديل النقدي</span>
                                    </button>
                                    <p><MdKeyboardArrowLeft/></p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.helpContainer}>
                            <h2>المساعدة و الدعم الفني</h2>
                            <div className={styles.btnsContainer}>
                                <div className={styles.btnContent}>
                                    <button onClick={() => setOpenDev(true)}>
                                        <span><BsPersonVideo2/></span>
                                        <span>تواصل مع المطور</span>
                                    </button>
                                    <p><MdKeyboardArrowLeft/></p>
                                </div>
                                <div className={styles.btnContent}>
                                    <button onClick={handleLogout}>
                                        <span><RiLogoutCircleLine/></span>
                                        <span>تسجيل الخروج</span>
                                    </button>
                                    <p><MdKeyboardArrowLeft/></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Sittings;