'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

// مكتبة Excel
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Reports() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [operationFilter, setOperationFilter] = useState('');
  const [email, setEmail] = useState('');
  const [total, setTotal] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLockAndSetEmail = async () => {
      const userEmail = localStorage.getItem("email");
      if (!userEmail) {
        router.push('/');
        return;
      }

      setEmail(userEmail);

      const q = query(collection(db, "users"), where("email", "==", userEmail));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const user = snapshot.docs[0].data();
        if (user.lockReports) {
          const pass = prompt("🔐 تم قفل صفحة التقارير\nادخل كلمة المرور:");
          if (pass === user.lockPassword) {
            setAuthorized(true);
          } else {
            alert("❌ كلمة المرور غير صحيحة");
            router.push('/');
            return;
          }
        } else {
          setAuthorized(true);
        }
      } else {
        router.push('/');
        return;
      }

      setLoading(false);
    };

    checkLockAndSetEmail();
  }, []);

  useEffect(() => {
    if (!authorized || !email) return;

    const q = query(collection(db, 'reports'), where('userEmail', '==', email));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allReports = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        let reportDateTime = null;
        if (data.createdAt?.toDate) {
          reportDateTime = data.createdAt.toDate().toLocaleString("ar-EG");
        } else if (data.date) {
          const parsedDate = new Date(data.date);
          if (!isNaN(parsedDate)) {
            reportDateTime = parsedDate.toLocaleString("ar-EG");
          }
        }

        if (!reportDateTime) return;

        if (
          (!dateFrom || new Date(reportDateTime) >= new Date(dateFrom)) &&
          (!dateTo || new Date(reportDateTime) <= new Date(dateTo))
        ) {
          if (!phoneSearch || data.phone?.includes(phoneSearch)) {
            allReports.push({ ...data, id: docSnap.id, reportDateTime });
          }
        }
      });

      allReports.sort((a, b) => new Date(b.reportDateTime) - new Date(a.reportDateTime));

      setReports(allReports);
    });

    return () => unsubscribe();
  }, [authorized, dateFrom, dateTo, phoneSearch, email]);

  useEffect(() => {
    let filteredReports = reports;
    if (operationFilter) {
      filteredReports = reports.filter((r) => r.type === operationFilter);
    }

    const subTotal = filteredReports.reduce((acc, report) => acc + Number(report.commation || 0), 0);
    setTotal(subTotal);
  }, [reports, operationFilter]);

  const handleDeleteAllReports = async () => {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف جميع التقارير؟ لا يمكن التراجع.");
    if (!confirmDelete) return;

    try {
      const q = query(collection(db, "reports"), where("userEmail", "==", email));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "reports", docSnap.id))
      );

      await Promise.all(deletePromises);
      alert("✅ تم حذف جميع التقارير بنجاح");
    } catch (error) {
      console.error("❌ حدث خطأ أثناء الحذف:", error);
      alert("حدث خطأ أثناء حذف التقارير");
    }
  };

  // 🚀 تصدير البيانات لملف Excel بجدولين (ارسال + استلام)
const handleExportExcel = () => {
  if (reports.length === 0) {
    alert("⚠️ لا يوجد بيانات للتصدير");
    return;
  }

  // فلترة العمليات حسب الاختيار (إرسال/استلام)
  let filteredReports = operationFilter
    ? reports.filter((r) => r.type === operationFilter)
    : reports;

  // تقسيم البيانات لإرسال واستلام
  const sendReports = filteredReports.filter((r) => r.type === "ارسال");
  const receiveReports = filteredReports.filter((r) => r.type === "استلام");

  // حساب إجمالي العمولة
  const sumSend = sendReports.reduce((acc, r) => acc + Number(r.commation || 0), 0);
  const sumReceive = receiveReports.reduce((acc, r) => acc + Number(r.commation || 0), 0);

  // تجهيز بيانات جدول الاستلام
  const receiveSheetData = [
    { "---": "📌 جدول الاستلام" },
    ...receiveReports.map((report) => ({
      الرقم: report.phone || "-",
      العملية: report.type || "-",
      المبلغ: `${report.operationVal || 0} جنية`,
      العمولة: `${report.commation || 0} جنية`,
      الملاحظات: report.notes || "-",
      "التاريخ والوقت": report.reportDateTime || "-",
    })),
    {
      الرقم: "الإجمالي",
      العملية: "-",
      المبلغ: "-",
      العمولة: `${sumReceive} جنية`,
      الملاحظات: "-",
      "التاريخ والوقت": "-",
    },
    {}, // صف فاصل فاضي
  ];

  // تجهيز بيانات جدول الإرسال
  const sendSheetData = [
    { "---": "📌 جدول الإرسال" },
    ...sendReports.map((report) => ({
      الرقم: report.phone || "-",
      العملية: report.type || "-",
      المبلغ: `${report.operationVal || 0} جنية`,
      العمولة: `${report.commation || 0} جنية`,
      الملاحظات: report.notes || "-",
      "التاريخ والوقت": report.reportDateTime || "-",
    })),
    {
      الرقم: "الإجمالي",
      العملية: "-",
      المبلغ: "-",
      العمولة: `${sumSend} جنية`,
      الملاحظات: "-",
      "التاريخ والوقت": "-",
    },
  ];

  // دمج الجدولين في شيت واحد
  const sheetData = [...receiveSheetData, ...sendSheetData];

  // إنشاء الملف
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sheetData);

  // إضافة الشيت
  XLSX.utils.book_append_sheet(workbook, worksheet, "التقارير");

  // حفظ الملف
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(data, `reports_${new Date().toISOString().split("T")[0]}.xlsx`);
};



  if (loading) return <p>🔄 جاري التحقق...</p>;
  if (!authorized) return null;

  return (
    <div className="main">
      <div className={styles.reportsContainer}>
        <div className="header">
          <h2>التقارير</h2>
          <Link href={"/"} className="headerLink">
            <MdOutlineKeyboardArrowLeft />
          </Link>
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputBox}>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className={styles.inputBox}>
            <input type="number" placeholder="ابحث برقم الهاتف" onChange={(e) => setPhoneSearch(e.target.value)} />
            <select value={operationFilter} onChange={(e) => setOperationFilter(e.target.value)}>
              <option value="">الكل</option>
              <option value="استلام">استلام</option>
              <option value="ارسال">ارسال</option>
            </select>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentTitle}>
            <h2>اجمالي الارباح : {total} جنية</h2>
            <div className={styles.btnsContainer}>
              <button onClick={() => window.print()}>PDF</button>
              <button onClick={handleExportExcel}>Excel</button>
              <button onClick={handleDeleteAllReports}><FaTrashAlt/></button>
            </div>
          </div>
          <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>العملية</th>
                    <th>المبلغ</th>
                    <th>العمولة</th>
                    <th>ملاحظات</th>
                    <th>التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {reports
                    .filter((report) => !operationFilter || report.type === operationFilter)
                    .map((report) => (
                      <tr key={report.id}>
                        <td>{report.phone || "-"}</td>
                        <td>{report.type || "-"}</td>
                        <td>{report.operationVal || 0} جنية</td>
                        <td>{report.commation || 0} جنية</td>
                        <td>{report.notes || "-"}</td>
                        <td>{report.reportDateTime}</td>
                      </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
