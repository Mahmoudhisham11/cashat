'use client';
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import avatar from "../../public/image/Avatar-Profile-Vector-removebg-preview.png"
import Image from "next/image";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { BiMemoryCard } from "react-icons/bi";
import { FaArchive } from "react-icons/fa";
import { FaRegTrashAlt } from "react-icons/fa";
import Nav from "../Nav/page";
import Wallet from "../Wallet/page"
import Cash from "../Cash/page"
import { db } from "../../app/firebase";
import { collection, deleteDoc, getDocs, onSnapshot, query, where, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

function Main() {
    const router = useRouter();
    const [openWallet, setOpenWallet] = useState(false);
    const [openCash, setOpenCash] = useState(false);
    const [active, setActive] = useState('')
    const [userName, setUesrName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [total, setTotal] = useState('');
    const [operations, setOperations] = useState([])
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        document.body.className = savedTheme;
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.body.className = newTheme;
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storageName = localStorage.getItem("name");
            const storageEmail = localStorage.getItem("email");
            if (storageName) {
                setUesrName(storageName);
                setUserEmail(storageEmail);
            }
        }
    }, []);

    useEffect(() => {
        if (!userEmail) return;
        const q = query(collection(db, 'users'), where('email', '==', userEmail));
        const userSubscribe = onSnapshot(q, (querySanpshot) => {
            const dataDoc = querySanpshot.docs[0];
            const data = dataDoc.data();
            if (!data.isSubscribed) {
                localStorage.clear();
                window.location.reload();
            }
            setTotal(Number(data.cash) + Number(data.wallet));
        });
        const opQ = query(collection(db, 'operations'), where('userEmail', '==', userEmail))
        const unSubscribeOp = onSnapshot(opQ, (querySanpshot) => {
            const opArray = [] 
            querySanpshot.forEach((doc) => {
                opArray.push({...doc.data(), id: doc.id})
            })
            setOperations(opArray)
        })
        return () => {userSubscribe(), unSubscribeOp()};
    }, [userEmail]);


    const handelDelete = async (id) => {
        try {
            const opRef = doc(db, 'operations', id);
            const opSnap = await getDoc(opRef);

            if (!opSnap.exists()) {
                alert("العملية غير موجودة");
                return;
            }

            const operationData = opSnap.data();
            const { phone, operationVal, type, userEmail } = operationData;

            console.log("بيانات العملية:", operationData);

            const nq = query(
                collection(db, 'numbers'),
                where('phone', '==', phone),
                where('userEmail', '==', userEmail)
            );
            const nSnapshot = await getDocs(nq);

            if (nSnapshot.empty) {
                alert("لم يتم العثور على الشريحة.");
                return;
            }

            const numberDoc = nSnapshot.docs[0];
            const numberRef = doc(db, 'numbers', numberDoc.id);
            const numberData = numberDoc.data();

            const oldAmount = Number(numberData.amount);
            const value = Number(operationVal);

            console.log("الرصيد الحالي:", oldAmount, "قيمة العملية:", value);

            if (isNaN(oldAmount) || isNaN(value)) {
                alert("خطأ في القيم الرقمية. تأكد من صحة البيانات.");
                return;
            }

            let newAmount;

            if (type === "ارسال") {
                newAmount = oldAmount + value;
            } else if (type === "استلام") {
                newAmount = oldAmount - value;
                if (newAmount < 0) {
                    alert("لا يمكن حذف العملية لأن الرصيد الناتج سيكون بالسالب.");
                    return;
                }
            } else {
                alert("نوع العملية غير معروف.");
                return;
            }

            // تحديث الرصيد
            await updateDoc(numberRef, {
                amount: newAmount
            });

            // حذف العملية
            await deleteDoc(opRef);

            alert("✅ تم حذف العملية وتحديث الرصيد بنجاح.");

        } catch (error) {
            alert("❌ حدث خطأ أثناء حذف العملية. راجع Console لمزيد من التفاصيل.");
        }
    };

    const handelDeleteDay = async () => {
        const confirmDelete = window.confirm("هل أنت متأكد من تقفيل اليوم؟ سيتم نقل العمليات إلى الأرشيف ومسحها من القائمة.");
        if (!confirmDelete) return;

        try {
            const userEmail = localStorage.getItem('email');
            if (!userEmail) {
                alert("لا يمكن العثور على البريد الإلكتروني للمستخدم.");
                return;
            }

            const opQ = query(collection(db, 'operations'), where('userEmail', '==', userEmail));
            const querySnapshot = await getDocs(opQ);

            if (querySnapshot.empty) {
                alert("لا توجد عمليات اليوم.");
                return;
            }

            // نقل العمليات إلى reports
            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
                if (!data) continue;

                await addDoc(collection(db, 'reports'), {
                    ...data,
                    archivedAt: new Date().toISOString(),
                });

                await deleteDoc(doc(db, 'operations', docSnap.id));
            }

            alert("تم تقفيل اليوم بنجاح ✅");
        } catch (error) {
            console.error("Error during end of day operations:", error);
            alert("حدث خطأ أثناء تقفيل اليوم ❌");
        }
    };

    return (
        <div className={styles.main}>
            <Wallet openWallet={openWallet} setOpenWallet={setOpenWallet} />
            <Cash openCash={openCash} setOpenCash={setOpenCash} />
            <Nav/>
            <div className={styles.title}>
                <div className={styles.text}>
                    <Image src={avatar} className={styles.avatar} alt="avatar"/>
                    <h2>مرحبا, <br /> {userName} 👋</h2>
                </div>
                <label className="switch">
                    <span className="sun">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <g fill="#ffd43b">
                                <circle r="5" cy="12" cx="12"></circle>
                                <path d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.66-.29 1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1 -.75.29zm-12.02 12.02a1 1 0 0 1 -.71-.29 1 1 0 0 1 0-1.41l.71-.66a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.24zm6.36-14.36a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm-5.66-14.66a1 1 0 0 1 -.7-.29l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.29zm12.02 12.02a1 1 0 0 1 -.7-.29l-.66-.71a1 1 0 0 1 1.36-1.36l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.24z"></path>
                            </g>
                        </svg>
                    </span>
                    <span className="moon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#fff" d="M223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
                        </svg>
                    </span>
                    <input
                        type="checkbox"
                        className="input"
                        onChange={toggleTheme}
                        checked={theme === 'dark'}
                    />
                    <span className="slider"></span>
                </label>
            </div>
            <div className={styles.balanceContainer}>
                <div className={styles.balanceCard}>
                    <div className={styles.balanceHead}>
                        <p>رأس المال المتاح</p>
                        <h2>{total}.00 جنية</h2>
                    </div>
                    <div className={styles.balanceBtns}>
                        <button onClick={() => setOpenCash(true)}>
                            <span><FaArrowUp/></span>
                            <span>ارسال</span>
                        </button>
                        <button onClick={() => setOpenWallet(true)}>
                            <span><FaArrowDown/></span>
                            <span>استلام</span>
                        </button>
                        <button onClick={() => router.push('/Numbers')}>
                            <span><BiMemoryCard/></span>
                            <span>الخطوط</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className={styles.content}>
                <div className={styles.contentTitle}>
                    <h2>العمليات اليومية</h2>
                    <button onClick={handelDeleteDay}><FaArchive/></button>
                </div>
                <div className={styles.operations}>
                    {operations.map((operation, index) => {
                        return(
                            <div key={operation.id} onClick={() => setActive(active === index ? null : index)} className={active === index ? `${styles.card} ${styles.active}` : `${styles.card}`}>
                                <div className={styles.cardHead}>
                                    <h3>{operation.phone}</h3>
                                    <button onClick={() => handelDelete(operation.id)}><FaRegTrashAlt/></button>
                                </div>
                                <hr />
                                <div className={styles.cardBody}>
                                    <strong>نوع العملية : {operation.type}</strong>
                                    <strong>قيمة العملية : {operation.operationVal} جنية</strong>
                                    <strong>عمولة العملية : {operation.commation} جنية</strong>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

export default Main;
