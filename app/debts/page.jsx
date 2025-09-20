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

// ✅ استيراد مكتبة الاكسيل
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Debts() {
  const btns = ["اضف عميل جديد", "كل العملاء"];
  const [active, setActive] = useState(0);

  // بيانات الفورم
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [debtType, setDebtType] = useState("ليك");

  // بيانات الديون
  const [debts, setDebts] = useState([]);
  const [editId, setEditId] = useState(null);

  // مجموعات
  const [totalLik, setTotalLik] = useState(0);
  const [totalAlyek, setTotalAlyek] = useState(0);

  // ⭐ state لتخزين email بشكل دائم
  const [userEmail, setUserEmail] = useState("");

  // جلب email مرة واحدة عند تحميل الصفحة
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) setUserEmail(email);
  }, []);

  // تحميل البيانات بعد أن يكون userEmail موجود
  useEffect(() => {
    if (!userEmail) return;
    fetchDebts();
  }, [userEmail]);

  const fetchDebts = async () => {
    if (!userEmail) return;
    try {
      const q = query(collection(db, "debts"), where("userEmail", "==", userEmail));
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

  // إضافة / تعديل
  const handleSubmit = async () => {
    if (!userEmail) {
      alert("⚠️ لم يتم التعرف على المستخدم، يرجى تسجيل الدخول مجددًا");
      return;
    }

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
        const debtRef = doc(db, "debts", editId);
        await updateDoc(debtRef, debtData);
        alert("✅ تم تعديل العميل");
      } else {
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
    setActive(0);
  };

  // ✅ دالة تصدير البيانات إلى Excel
  const exportToExcel = () => {
    const data = debts.map((debt) => ({
      "اسم العميل": debt.clientName,
      "المبلغ": debt.amount,
      "النوع": debt.debtType,
      "التاريخ": debt.date,
    }));

    // إضافة الإجماليات
    data.push({});
    data.push({ "اسم العميل": "الإجمالي ليك", "المبلغ": totalLik });
    data.push({ "اسم العميل": "الإجمالي عليك", "المبلغ": totalAlyek });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الديون");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, `الديون_${new Date().toLocaleDateString("ar-EG")}.xlsx`);
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

        {/* صفحة إضافة عميل */}
        <div
          className={styles.debtsInfo}
          style={{ display: active === 0 ? "flex" : "none" }}
        >
          {userEmail ? (
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
          ) : (
            <p>⚠️ جاري التعرف على المستخدم...</p>
          )}
        </div>

        {/* صفحة عرض الكل */}
        <div
          className={styles.debtsContent}
          style={{ display: active === 1 ? "flex" : "none" }}
        >
          <div className={styles.headContainer}>
            <div className={styles.totals}>
              <strong>ليك: {totalLik} ج.م</strong>
              <strong>عليك: {totalAlyek} ج.م</strong>
            </div>
            <div className={styles.headBtns}>
              <button onClick={exportToExcel}>Excel</button>
            </div>
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
