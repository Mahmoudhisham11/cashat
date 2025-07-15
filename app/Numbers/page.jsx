'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { HiQrcode } from "react-icons/hi";
import { FaTrashAlt } from "react-icons/fa";
import { IoReloadOutline } from "react-icons/io5";
import { db } from "../firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where, getDocs } from "firebase/firestore";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";

function Numbers() {
    const router = useRouter();
    const [phone, setPhone] = useState('')
    const [name, setName] = useState('')
    const [idNumber, setIdNumber] = useState('')
    const [amount, setAmount] = useState('')
    const [limit, setLimit] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [qrNumber, setQrNumber] = useState('')
    const [active, setActive] = useState(0)
    const [openCard, setOpenCard] = useState('')
    const [openQr, setOpenQr] = useState(false)
    const [numbers, setNumbers] = useState([])
    const btns = ['اضف خط جديد','كل الخطوط']

    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLock = async () => {
            const email = localStorage.getItem("email");
            setUserEmail(email);
            if (!email) {
                router.push('/');
                return;
            }

            const q = query(collection(db, "users"), where("email", "==", email));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                const data = userDoc.data();

                if (data.lockNumbers) {
                    const input = prompt("🚫 تم قفل صفحة الخطوط\nمن فضلك أدخل كلمة المرور:");
                    if (input === data.lockPassword) {
                        setAuthorized(true);
                    } else {
                        alert("❌ كلمة المرور غير صحيحة");
                        router.push('/');
                    }
                } else {
                    setAuthorized(true);
                }
            } else {
                router.push('/');
            }

            setLoading(false);
        };

        checkLock();
    }, []);

    useEffect(() => {
        if (!userEmail) return;
        const q = query(collection(db, 'numbers'), where('userEmail', '==', userEmail))
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const numbersSnap = []
            querySnapshot.forEach((doc) => {
                numbersSnap.push({...doc.data(), id: doc.id})
            })
            setNumbers(numbersSnap)
        })
        return () => unsubscribe()
    }, [userEmail])

    const handelAddNumber = async() => {
        if(phone !== "") {
            await addDoc(collection(db, 'numbers'), {
                phone,
                name,
                idNumber,
                amount,
                limit,
                userEmail,
            })
            alert('تم اضافة الرقم بنجاح')
            setPhone('')
            setName('')
            setIdNumber('')
            setAmount('')
            setLimit('')
        }
    }

    const handleDelet = async(id) => {
        await deleteDoc(doc(db, 'numbers', id))
    }

    const handleQr = (phone) => {
        setQrNumber(phone)
        setOpenQr(true)
    }

    if (loading) return <p>جاري التحقق...</p>;
    if (!authorized) return null;

    return(
        <div className="main">
            <div className={openQr ? `${styles.qrContainer} ${styles.active}` : `${styles.qrContainer}`}>
                <button onClick={() => setOpenQr(false)}><MdOutlineKeyboardArrowLeft/></button>
                <QRCode value={qrNumber} size={200} />
                <h2>{qrNumber}</h2>
            </div>
            <div className={styles.numbersContainer}>
                <div className="header">
                    <h2>الارقام و الليمت</h2>
                    <Link href={"/"} className="headerLink"><MdOutlineKeyboardArrowLeft /></Link>
                </div>
                <div className={styles.content}>
                    <div className={styles.btnsContainer}>
                        {btns.map((btn, index) => {
                            return(
                                <button className={active === index ? `${styles.active}` : ``} onClick={() => setActive(index)} key={index}>{btn}</button>
                            )
                        })}
                    </div>
                    <div className={styles.cardInfo} style={{display: active === 0 ? 'flex' : 'none'}}>
                        <div className={styles.info}>
                            <div className="inputContainer">
                                <label>رقم الخط : </label>
                                <input type="number" value={phone} placeholder="اضف رقم الخط" onChange={(e) => setPhone(e.target.value)}/>
                            </div>
                            <div className="amounts">
                                <div className="inputContainer">
                                    <label>اسم المالك :</label>
                                    <input type="text" value={name} placeholder="اضف اسم مالك الخط" onChange={(e) => setName(e.target.value)}/>
                                </div>
                                <div className="inputContainer">
                                    <label>الرقم القومي :</label>
                                    <input type="number" value={idNumber} placeholder="اضف الرقم القومي" onChange={(e) => setIdNumber(e.target.value)}/>
                                </div>
                            </div>
                            <div className="amounts">
                                <div className="inputContainer">
                                    <label> رصيد الخط :</label>
                                    <input type="number" value={amount} placeholder="0" onChange={(e) => setAmount(e.target.value)}/>
                                </div>
                                <div className="inputContainer">
                                    <label> الليمت :</label>
                                    <input type="number" value={limit} placeholder="0" onChange={(e) => setLimit(e.target.value)}/>
                                </div>
                            </div>
                        </div>
                        <button className={styles.addBtn} onClick={handelAddNumber}>اكمل العملية</button>
                    </div>
                    <div className={styles.cardContent} style={{display: active == 1 ? 'flex' : 'none'}}>
                        {numbers.map((number, index) => {
                            return(
                                <div key={number.id} onClick={() => setOpenCard(openCard === index ? null : index)} className={openCard === index ? `${styles.numDiv} ${styles.open}` : `${styles.numDiv}`}>
                                    <div className={styles.divHeader}>
                                        <h2 style={{color: Number(number.withdraw) + Number(number.deposit) >= 50000 ? 'red' : ''}}>{number.phone}</h2>
                                        <div className={styles.btns}>
                                            <button onClick={() => handleQr(number.phone)}><HiQrcode/></button>
                                            <button onClick={() => handleDelet(number.id)}><FaTrashAlt/></button>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className={styles.divFooter}>
                                        <strong>اسم المالك : {number.name}</strong>
                                        <strong>الرقم القومي: {number.idNumber}</strong>
                                        <strong> رصيد الخط: {number.amount}</strong>
                                        <strong>الليمت المتاح: {Number(number.limit)}</strong>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Numbers;
