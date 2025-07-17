'use client';
import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { db } from "../../app/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  onSnapshot,
} from "firebase/firestore";

function Cash({ openCash, setOpenCash }) {
  const [operationVal, setOperationVal] = useState("");
  const [phone, setPhone] = useState("");
  const [commation, setCommation] = useState("");
  const [limit, setLimit] = useState("");
  const [amount, setAmount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageEmail = localStorage.getItem("email");
      if (storageEmail) {
        setUserEmail(storageEmail);
      }
    }
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    const q = query(collection(db, "numbers"), where("userEmail", "==", userEmail));
    const unSubscripe = onSnapshot(q, (querySnapshot) => {
      const numbers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPhoneNumbers(numbers);
    });

    return () => unSubscripe();
  }, [userEmail]);

  useEffect(() => {
    if (phone && phoneNumbers.length > 0) {
      const selected = phoneNumbers.find((p) => p.phone === phone);
      if (selected) {
        setLimit(selected.limit);
        setAmount(selected.amount);
      }
    }
  }, [phone, phoneNumbers]);

    const handleCashAdd = async () => {
      if (!phone || phone.trim() === "") {
        alert("من فضلك اختر رقم الشريحة");
        return;
      }

      if (!operationVal || isNaN(Number(operationVal))) {
        alert("قيمة العملية غير صالحة");
        return;
      }

      if (!commation || isNaN(Number(commation))) {
        alert("قيمة العمولة غير صالحة");
        return;
      }

      if (Number(operationVal) > Number(amount)) {
        alert("قيمة العملية أكبر من رصيد الخط الحالي");
        return;
      }

      const q = query(collection(db, "users"), where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userRef = doc(db, "users", userDoc.id);

        await addDoc(collection(db, "operations"), {
          userEmail,
          commation,
          operationVal,
          phone,
          type: "ارسال",
          date: new Date().toISOString().split("T")[0],
        });

        await updateDoc(userRef, {
          wallet: Number(userData.wallet) - Number(operationVal),
          cash: Number(userData.cash) + Number(operationVal),
        });

        const nq = query(
          collection(db, "numbers"),
          where("phone", "==", phone),
          where("userEmail", "==", userEmail)
        );
        const nSnapshot = await getDocs(nq);
        if (!nSnapshot.empty) {
          const numberDoc = nSnapshot.docs[0];
          const numberRef = doc(db, "numbers", numberDoc.id);
          const numberData = numberDoc.data();
          await updateDoc(numberRef, {
            amount: Number(numberData.amount) - Number(operationVal),
            depositLimit: Number(numberData.depositLimit) - Number(operationVal),
            dailyDeposit: Number(numberData.dailyDeposit) - Number(operationVal)
          });
        }

        alert("تم اتمام العملية بنجاح");
        setCommation("");
        setOperationVal("");
        setPhone("");
      }
    };

  return (
    <div className={openCash ? "operationContainer active" : "operationContainer"}>
      <div className="conatainerHead">
        <button className={styles.closeBtn} onClick={() => setOpenCash(false)}>
          <MdOutlineKeyboardArrowLeft />
        </button>
        <h2>عملية ارسال</h2>
      </div>

      <div className="operationBox">
        <div className="operationsContent">
          <div className="inputContainer">
            <label>ادخل رقم الشريحة :</label>
            <input
              type="number"
              list="numbers"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ابحث عن رقم المحفظة"
              value={phone}
            />
            <datalist id="numbers">
              {phoneNumbers.map((item, index) => (
                <option key={index} value={item.phone} />
              ))}
            </datalist>
          </div>

          <div className="amounts">
            <div className="inputContainer">
              <label>المبلغ :</label>
              <input
                type="number"
                value={operationVal}
                placeholder="0"
                onChange={(e) => setOperationVal(e.target.value)}
              />
            </div>
            <div className="inputContainer">
              <label>العمولة:</label>
              <input
                type="number"
                value={commation}
                placeholder="0"
                onChange={(e) => setCommation(e.target.value)}
              />
            </div>
            <div className="inputContainer">
              <label>الصافي :</label>
              <input
                type="number"
                value={Number(operationVal) + Number(commation)}
                placeholder="0"
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="amounts">
            <div className="inputContainer">
              <label>الليمت المتاح :</label>
              <input
                type="number"
                value={Number(limit)}
                placeholder="0"
                disabled
                readOnly
              />
            </div>
            <div className="inputContainer">
              <label>الرصيد :</label>
              <input type="number" value={amount} placeholder="0" disabled readOnly />
            </div>
          </div>
        </div>

        <button className="operationBtn" onClick={handleCashAdd}>
          اكمل العملية
        </button>
      </div>
    </div>
  );
}

export default Cash;
