'use client';
import { useState } from 'react';
import Tesseract from 'tesseract.js';
import styles from "./styles.module.css";
import Link from 'next/link';
import { IoIosArrowDropleftCircle } from "react-icons/io";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';

function Image() {
    const [image, setImage] = useState(null);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const [type, setType] = useState('');
    const [operationVal, setOperationVal] = useState('');
    const [date, setDate] = useState('');
    const [phone, setPhone] = useState('');
    const [commation, setCommation] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImage(URL.createObjectURL(file));
        setLoading(true);

        const result = await Tesseract.recognize(file, 'ara+eng', {
            logger: m => console.log(m)
        });

        const ocrText = result.data.text;
        console.log("🔍 النص المقروء:", ocrText);
        setText(ocrText);
        setLoading(false);

        // نوع العملية
        let originalType = "غير معروف";
        if (ocrText.includes("تم استلام")) {
            originalType = "استلام";
        } else if (ocrText.includes("تم تحويل") || ocrText.includes("تم إرسال") || ocrText.includes("تم سحب")) {
            originalType = "ارسال";
        } else if (ocrText.includes("تم إيداع")) {
            originalType = "استلام";
        }
        setType(originalType);

        // القيمة
        const valueMatch = ocrText.match(/(?:مبلغ|قيمته|قيمة)?\s?(\d+(\.\d+)?)(?=\s?جنيه)/);
        let value = valueMatch ? valueMatch[1] : '';
        let finalValue = '';
        if (value) {
            const floatVal = parseFloat(value);
            finalValue = floatVal % 1 === 0 ? floatVal.toFixed(0) : floatVal.toFixed(2);
            setOperationVal(finalValue);

            // حساب العمولة 1% وتقريبها
            const comm = Math.round(floatVal * 0.01);
            setCommation(comm.toString());
        }

        // التاريخ
        const dateMatch = ocrText.match(/(\d{2}-\d{2}-\d{4})/);
        const shortDateMatch = ocrText.match(/(\d{2}-\d{2}-\d{2})/);
        let finalDate = dateMatch?.[1] || null;
        if (!finalDate && shortDateMatch) {
            const parts = shortDateMatch[1].split('-');
            finalDate = `20${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (!finalDate) {
            finalDate = new Date().toISOString().split('T')[0];
        }
        setDate(finalDate);

        // رقم الخط
        let extractedPhone = "غير معروف";
        const pattern1 = ocrText.match(/(?:بإسم|:|الى|إلى|من)\s*(01[0-9\s\-]{8,})/);
        const pattern2 = ocrText.match(/01[0-9\s\-]{8,}/);
        const arabicDigitsMatch = ocrText.match(/[\u0660-\u0669]{11}/);

        if (pattern1) {
            extractedPhone = pattern1[1].replace(/\s|-/g, '');
        } else if (pattern2) {
            extractedPhone = pattern2[0].replace(/\s|-/g, '');
        } else if (arabicDigitsMatch) {
            const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
            extractedPhone = arabicDigitsMatch[0].split('').map(d => arabicDigits.indexOf(d)).join('');
        }
        setPhone(extractedPhone);
    };

    const handleAddData = async () => {
        const userEmail = localStorage.getItem('email');
        const amountNumber = parseFloat(operationVal);

        // إضافة التقرير
        await addDoc(collection(db, 'reports'), {
            type,
            phone,
            operationVal,
            commation,
            date,
            userEmail
        });

        // تحديث البيانات في numbers
        const q = query(collection(db, 'numbers'), where('phone', '==', phone), where('userEmail', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const numberDoc = querySnapshot.docs[0];
            const numberRef = doc(db, 'numbers', numberDoc.id);
            const numberData = numberDoc.data();

            let updatedWallet = numberData.wallet || 0;
            let updatedDeposit = numberData.deposit || 0;

            if (type === "ارسال") {
                updatedWallet -= amountNumber;
                updatedDeposit += amountNumber;
            } else if (type === "استلام") {
                updatedWallet += amountNumber;
                updatedDeposit -= amountNumber;
            }

            await updateDoc(numberRef, {
                wallet: updatedWallet,
                deposit: updatedDeposit
            });
        }
    };

    return (
        <div className="main">
            <div className={styles.image}>
                <div className="title">
                    <h2>تحميل صورة العميلة</h2>
                    <Link href={"/"} className="titleLink"><IoIosArrowDropleftCircle /></Link>
                </div>
                <div className={styles.container}>
                    <div className={styles.imageContainer}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                        {loading && <p>جاري قراءة الصورة...</p>}
                        {image && <img src={image} alt="screenshot" style={{ width: '100%', maxWidth: 400, marginTop: 10 }} />}
                    </div>

                    {text && (
                        <div className={styles.text}>
                            <h3>النص المستخرج:</h3>
                            <p>{text}</p>
                        </div>
                    )}

                    {(type || operationVal || date || phone) && (
                        <div className={styles.result}>
                            <h3>البيانات المستخرجة:</h3>
                            <p>النوع: {type}</p>
                            <p>القيمة: {operationVal} جنيه</p>
                            <p>العمولة: {commation} جنيه</p>
                            <p>التاريخ: {date}</p>
                            <p>رقم الخط: {phone}</p>
                        </div>
                    )}

                    <div className={styles.dataContainer}>
                        <h2>ادخال العملية يدويا</h2>
                        <div className="inputContainer">
                            <label>رقم الخط :</label>
                            <input type="number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="inputContainer">
                            <label>قيمة العملية :</label>
                            <input type="number" value={operationVal} onChange={(e) => setOperationVal(e.target.value)} />
                        </div>
                        <div className="inputContainer">
                            <label>قيمة العمولة :</label>
                            <input type="number" value={commation} onChange={(e) => setCommation(e.target.value)} />
                        </div>
                        <div className="inputContainer">
                            <label>نوع العملية :</label>
                            <select value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="ارسال">ارسال</option>
                                <option value="استلام">استلام</option>
                            </select>
                        </div>
                        <div className="inputContainer">
                            <label>التاريخ :</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <button onClick={handleAddData}>اكمل العملية</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Image;
