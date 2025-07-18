'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { GiMoneyStack } from "react-icons/gi";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { RiLogoutCircleLine } from "react-icons/ri";
import { BsPersonVideo2 } from "react-icons/bs";
import { CiLock } from "react-icons/ci";
import { useRouter } from "next/navigation";
import CashPop from "../../components/CashPop/page";
import Developer from "../../components/Developer/page";
import { db } from "../../app/firebase";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

function Sittings() {
    const router = useRouter();
    const [openCash, setOpenCash] = useState(false);
    const [openDev, setOpenDev] = useState(false);
    const [userName, setUserName] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [locks, setLocks] = useState({ reports: false, numbers: false, money: false, cash: false });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storageName = localStorage.getItem('name');
            if (storageName) {
                setUserName(storageName);
            }
        }
    }, []);

    useEffect(() => {
        const fetchPassword = async () => {
            const email = localStorage.getItem("email");
            if (!email) return;

            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const data = userDoc.data();
                if (data.lockPassword) {
                    setHasPassword(true);
                }
            }
        };

        fetchPassword();
    }, []);

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
            router.push('/');
        }
    };

    const handlePasswordSave = async () => {
        const email = localStorage.getItem("email");
        if (!email || !password) return;

        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userRef = doc(db, "users", userDoc.id);
            const data = userDoc.data();

            if (!data.lockPassword) {
                await updateDoc(userRef, {
                    lockPassword: password,
                    lockReports: locks.reports,
                    lockNumbers: locks.numbers,
                    lockMoney: locks.money,
                    lockCash: locks.cash
                });

                alert("✅ تم تعيين كلمة المرور لأول مرة");

                setHasPassword(true);
                setIsPasswordVerified(true);
                setPassword('');
                setShowPasswordForm(true);
            } else {
                alert("⚠️ كلمة المرور تم تعيينها بالفعل ولا يمكن تعديلها");
            }  
        }
    };

    const verifyPassword = async () => {
        const email = localStorage.getItem("email");
        if (!email) return;

        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data();

            if (data.lockPassword === passwordInput) {
                setIsPasswordVerified(true);
                setLocks({
                    reports: data.lockReports || false,
                    numbers: data.lockNumbers || false,
                    money: data.lockMoney || false,
                    cash: data.lockCash || false
                });
            } else {
                alert("كلمة المرور غير صحيحة ❌");
            }
        }
    };

    const handleLockUpdate = async () => {
        const email = localStorage.getItem("email");
        if (!email) return;

        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userRef = doc(db, "users", userDoc.id);

            await updateDoc(userRef, {
                lockReports: locks.reports,
                lockNumbers: locks.numbers,
                lockMoney: locks.money,
                lockCash: locks.cash
            });

            alert("✅ تم تحديث الاختيارات بدون تغيير كلمة المرور");
            if(typeof window !== "undefined") {
                window.location.reload()
            }
        }
    };

    return (
        <div className="main">
            <Developer openDev={openDev} setOpenDev={setOpenDev} />
            <CashPop openCash={openCash} setOpenCash={setOpenCash} />
            <div className={styles.sittingsContainer}>
                <div className="header">
                    <h2>الاعدادات</h2>
                    <Link href={"/"} className="headerLink"><MdOutlineKeyboardArrowLeft /></Link>
                </div>
                <div className={styles.content}>
                    <div className={styles.accContainer}>
                        <h2>تفاصيل الملف الشخصي</h2>
                        <div className={styles.btnsContainer}>
                            <div className={styles.btnContent}>
                                <button onClick={() => setOpenCash(true)}>
                                    <span><GiMoneyStack /></span>
                                    <span>تعديل النقدي</span>
                                </button>
                                <p><MdKeyboardArrowLeft /></p>
                            </div>
                            <hr />
                            <div className={styles.btnContent}>
                                <button onClick={() => setShowPasswordForm(!showPasswordForm)}>
                                    <span><CiLock /></span>
                                    <span>كلمات المرور</span>
                                </button>
                                <p><MdKeyboardArrowLeft /></p>
                            </div>
                        </div>

                        {showPasswordForm && (
                            <div className={styles.passwordForm}>
                                {!hasPassword && (
                                    <>
                                        <label>اكتب كلمة المرور لأول مرة:</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button onClick={handlePasswordSave}>حفظ كلمة المرور</button>
                                    </>
                                )}

                                {hasPassword && !isPasswordVerified && (
                                    <>
                                        <label>ادخل كلمة المرور:</label>
                                        <input
                                            type="password"
                                            value={passwordInput}
                                            onChange={(e) => setPasswordInput(e.target.value)}
                                        />
                                        <button onClick={verifyPassword}>تحقق</button>
                                    </>
                                )}

                                {isPasswordVerified && (
                                    <>
                                        <div className={styles.locks}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={locks.reports}
                                                    onChange={() => setLocks(prev => ({ ...prev, reports: !prev.reports }))}
                                                />
                                                اقفال التقارير
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={locks.numbers}
                                                    onChange={() => setLocks(prev => ({ ...prev, numbers: !prev.numbers }))}
                                                />
                                                اقفال الخطوط
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={locks.money}
                                                    onChange={() => setLocks(prev => ({ ...prev, money: !prev.money }))}
                                                />
                                                اقفال المالية
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={locks.cash}
                                                    onChange={() => setLocks(prev => ({ ...prev, cash: !prev.cash }))}
                                                />
                                                اقفال النقدي
                                            </label>
                                        </div>
                                        <button onClick={handleLockUpdate}>حفظ التعديلات</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={styles.helpContainer}>
                        <h2>المساعدة و الدعم الفني</h2>
                        <div className={styles.btnsContainer}>
                            <div className={styles.btnContent}>
                                <button onClick={() => setOpenDev(true)}>
                                    <span><BsPersonVideo2 /></span>
                                    <span>تواصل مع المطور</span>
                                </button>
                                <p><MdKeyboardArrowLeft /></p>
                            </div>
                            <hr />
                            <div className={styles.btnContent}>
                                <button onClick={handleLogout}>
                                    <span><RiLogoutCircleLine /></span>
                                    <span>تسجيل الخروج</span>
                                </button>
                                <p><MdKeyboardArrowLeft /></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sittings;
