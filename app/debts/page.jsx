'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { MdModeEditOutline } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

function Debts() {
  const btns = ["اضف عميل جديد", "كل العملاء"];
  const [active, setActive] = useState(0);

  // بيانات الفورم
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [debtType, setDebtType] = useState("ليك");

  // بيانات الديون
  const [debts, setDebts] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [editId, setEditId] = useState(null);

  // مجموعات
  const [totalLik, setTotalLik] = useState(0);
  const [totalAlyek, setTotalAlyek] = useState(0);

  // جلب ايميل المستخدم من localStorage
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) setUserEmail(email);
  }, []);

  // تحميل البيانات من فايربيز
  useEffect(() => {
    if (userEmail) fetchDebts();
  }, [userEmail]);

  const fetchDebts = async () => {
    try {
      const q = query(
        collection(db, "debts"),
        where("userEmail", "==", userEmail)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDebts(data);

      // حساب المجموعات
      let lik = 0;
      let alyek = 0;
      data.forEach((d) => {
        const val = Number(d.amount) || 0;
        if (d.debtType === "ليك") lik += val;
        else alyek += val;
      });
      setTotalLik(lik);
      setTotalAlyek(alyek);
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
    }
  };

  // اضافة / تعديل
  const handleSubmit = async () => {
    if (!clientName || !amount) {
      alert("⚠️ من فضلك املأ جميع الحقول");
      return;
    }

    const debtData = {
      clientName,
      amount: Number(amount),
      debtType,
      userEmail,
      date: new Date().toLocaleDateString("ar-EG"),
    };

    try {
      if (editId) {
        // تعديل
        const debtRef = doc(db, "debts", editId);
        await updateDoc(debtRef, debtData);
        alert("✅ تم تعديل العميل");
      } else {
        // اضافة
        await addDoc(collection(db, "debts"), debtData);
        alert("✅ تم اضافة العميل");
      }

      // مسح الحقول
      setClientName("");
      setAmount("");
      setDebtType("ليك");
      setEditId(null);

      fetchDebts();
    } catch (error) {
      console.error("خطأ أثناء الحفظ:", error);
    }
  };

  // حذف
  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await deleteDoc(doc(db, "debts", id));
      alert("✅ تم الحذف بنجاح");
      fetchDebts();
    } catch (error) {
      console.error("خطأ أثناء الحذف:", error);
    }
  };

  // تعديل (ملء الحقول)
  const handleEdit = (debt) => {
    setClientName(debt.clientName);
    setAmount(debt.amount);
    setDebtType(debt.debtType);
    setEditId(debt.id);
    setActive(0); // يوديك على صفحة الادخال
  };

  return (
    <div className={styles.debts}>
      <div className="header">
        <h2>الديون</h2>
        <Link href={"/"} className="headerLink">
          <MdOutlineKeyboardArrowLeft />
        </Link>
      </div>

      <div className={styles.content}>
        {/* أزرار التنقل */}
        <div className={styles.btnsContainer}>
          {btns.map((btn, index) => (
            <button
              className={active === index ? `${styles.active}` : ``}
              onClick={() => setActive(index)}
              key={index}
            >
              {btn}
            </button>
          ))}
        </div>

        {/* صفحة الاضافة */}
        <div
          className={styles.debtsInfo}
          style={{ display: active === 0 ? "flex" : "none" }}
        >
          <div className={styles.info}>
            <div className="inputContainer">
              <label>اسم العميل:</label>
              <input
                type="text"
                placeholder="ادخل اسم العميل"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="inputContainer">
              <label>المبلغ:</label>
              <input
                type="number"
                placeholder="ادخل المبلغ"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="inputContainer">
              <label>نوع الدين:</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value)}
              >
                <option value="ليك">ليك</option>
                <option value="عليك">عليك</option>
              </select>
            </div>
            <button onClick={handleSubmit} className={styles.addBtn}>
              {editId ? "تعديل العميل" : "اضافة العميل"}
            </button>
          </div>
        </div>

        {/* صفحة عرض الكل */}
        <div
          className={styles.debtsContent}
          style={{ display: active === 1 ? "flex" : "none" }}
        >
          <div className={styles.totals}>
            <strong>ليك: {totalLik} ج.م</strong>
            <strong>عليك: {totalAlyek} ج.م</strong>
          </div>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th>اسم العميل</th>
                  <th>المبلغ</th>
                  <th>النوع</th>
                  <th>التاريخ</th>
                  <th>تفاعل</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.id}>
                    <td>{debt.clientName}</td>
                    <td>{debt.amount} ج.م</td>
                    <td>{debt.debtType}</td>
                    <td>{debt.date}</td>
                    <td className={styles.actions}>
                      <button onClick={() => handleEdit(debt)}>
                        <MdModeEditOutline />
                      </button>
                      <button onClick={() => handleDelete(debt.id)}>
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
                {debts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>
                      لا يوجد بيانات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Debts;
