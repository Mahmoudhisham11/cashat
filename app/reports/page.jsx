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

function Reports() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
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

        // تحديد التاريخ سواء كان createdAt (Timestamp) أو date (string)
        let reportDate = null;
        if (data.createdAt?.toDate) {
          reportDate = data.createdAt.toDate().toISOString().split("T")[0];
        } else if (data.date) {
          const parsedDate = new Date(data.date);
          if (!isNaN(parsedDate)) {
            reportDate = parsedDate.toISOString().split("T")[0];
          }
        }

        if (!reportDate) return; // تجاهل أي عملية من غير تاريخ

        // فلترة حسب التاريخ والبحث
        if (
          (!dateFrom || reportDate >= dateFrom) &&
          (!dateTo || reportDate <= dateTo)
        ) {
          if (!phoneSearch || data.phone?.includes(phoneSearch)) {
            allReports.push({ ...data, id: docSnap.id, reportDate });
          }
        }
      });

      // ترتيب حسب التاريخ تنازلي
      allReports.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));

      setReports(allReports);
    });

    return () => unsubscribe();
  }, [authorized, dateFrom, dateTo, phoneSearch, email]);

  useEffect(() => {
    const subTotal = reports.reduce((acc, report) => acc + Number(report.commation || 0), 0);
    setTotal(subTotal);
  }, [reports]);

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
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <input type="number" placeholder="ابحث برقم الهاتف" onChange={(e) => setPhoneSearch(e.target.value)} />
        </div>

        <div className={styles.content}>
          <div className={styles.contentTitle}>
            <h2>اجمالي الارباح : {total} جنية</h2>
            <div className={styles.btnsContainer}>
              <button onClick={() => window.print()}>PDF</button>
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
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.phone || "-"}</td>
                      <td>{report.type || "-"}</td>
                      <td>{report.operationVal || 0} جنية</td>
                      <td>{report.commation || 0} جنية</td>
                      <td>{report.notes || "-"}</td>
                      <td>{report.reportDate}</td>
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
