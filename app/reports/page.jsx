'use client';
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
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
  const [active, setActive] = useState('');
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
    if (!authorized || !email || !dateFrom) return;

    const q = query(collection(db, 'reports'), where('userEmail', '==', email));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allReports = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const reportDate = new Date(data.date).toISOString().split('T')[0];

        if (
          (!dateTo && reportDate === dateFrom) ||
          (dateTo && reportDate >= dateFrom && reportDate <= dateTo)
        ) {
          if (!phoneSearch || data.phone.includes(phoneSearch)) {
            allReports.push({ ...data, id: doc.id });
          }
        }
      });
      setReports(allReports);
    });

    return () => unsubscribe();
  }, [authorized, dateFrom, dateTo, phoneSearch, email]);

  useEffect(() => {
    const subTotal = reports.reduce((acc, report) => acc + Number(report.commation), 0);
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
            <button onClick={handleDeleteAllReports}><FaTrashAlt/></button>
          </div>

          {reports.map((report, index) => (
            <div
              className={active === index ? `${styles.card} ${styles.active}` : styles.card}
              key={report.id}
              onClick={() => setActive(active === index ? null : index)}
            >
              <div className={styles.cardHead}>
                <h2>{report.phone}</h2>
                <h2><IoIosArrowDown /></h2>
              </div>
              <hr />
              <div className={styles.cardBody}>
                <p><span>نوع العملية : </span><strong>{report.type}</strong></p>
                <p><span>المبلغ : </span><strong>{report.operationVal} جنية</strong></p>
                <p><span>العمولة : </span><strong>{report.commation} جنية</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reports;
