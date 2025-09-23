'use client';
import styles from "./styles.module.css";
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../../app/firebase";
import { addDoc, collection, doc, getDocs, query, updateDoc, where, serverTimestamp } from "firebase/firestore";
import { useState, useEffect } from "react";

function CashPop({ openCash, setOpenCash }) {
  const [cashVal, setCashVal] = useState("");
  const [notes, setNotes] = useState(""); // ✅ استيت جديدة للملاحظات
  const [userEmail, setUserEmail] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageEmail = localStorage.getItem("email");
      if (storageEmail) {
        setUserEmail(storageEmail);
      }
    }
  }, []);

  useEffect(() => {
    const checkLock = async () => {
      if (!userEmail) return;
      const q = query(collection(db, "users"), where("email", "==", userEmail));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const data = userDoc.data();

        if (data.lockCash) {
          const input = prompt("🚫 تم قفل صفحة النقدي\nمن فضلك أدخل كلمة المرور:");
          if (input === data.lockPassword) {
            setAuthorized(true);
          } else {
            alert("❌ كلمة المرور غير صحيحة");
            setOpenCash(false);
          }
        } else {
          setAuthorized(true);
        }
      } else {
        setOpenCash(false);
      }

      setLoading(false);
    };

    if (openCash) {
      checkLock();
    }
  }, [userEmail, openCash]);

  const handleUpdateCash = async () => {
    if (!cashVal) {
      alert("من فضلك ادخل قيمة صحيحة");
      return;
    }

    const q = query(collection(db, "users"), where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(db, "users", userDoc.id);

      // 1. تعديل قيمة النقدي عند المستخدم
      await updateDoc(userRef, { cash: Number(cashVal) });

      // 2. تسجيل العملية كعملية نقدية عادية + الملاحظات
      await addDoc(collection(db, "operations"), {
        operationVal: Number(cashVal),
        type: "تعديل نقدي",
        notes: notes || "", // ✅ إضافة الملاحظات
        createdAt: serverTimestamp(),
        userEmail,
      });

      alert("✅ تم تعديل قيمة النقدي وتسجيل العملية");
      setCashVal("");
      setNotes(""); // ✅ تفريغ الملاحظات بعد العملية
      setOpenCash(false);
    }
  };

  if (!authorized || loading) return null;

  return (
    <div className={openCash ? "shadowBox active" : "shadowBox"}>
      <div className="box">
        <button className={styles.closeBtn} onClick={() => setOpenCash(false)}>
          <IoIosCloseCircle />
        </button>
        <h2>تعديل قيمة النقدي</h2>
        <div className="boxForm">
          <div className="inputContainer">
            <label>قيمة النقدي : </label>
            <input
              type="number"
              value={cashVal}
              placeholder="تعديل قيمة النقدي"
              onChange={(e) => setCashVal(e.target.value)}
            />
          </div>
          <div className="inputContainer">
            <label>لملاحظات : </label>
            <input
              type="text"
              value={notes} // ✅ ربط القيمة بالـ state
              placeholder="ملاحظات"
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button className={styles.walletBtn} onClick={handleUpdateCash}>
            اكمل العملية
          </button>
        </div>
      </div>
    </div>
  );
}

export default CashPop;
