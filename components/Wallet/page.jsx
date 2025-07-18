'use client';
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { db } from "../../app/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

function Wallet({ openWallet, setOpenWallet }) {
  const [phone, setPhone] = useState("");
  const [operationVal, setOperationVal] = useState("");
  const [commation, setCommation] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [withdrawLimit, setWithdrawLimit] = useState("");
  const [dailyWithdraw, setDailyWithdraw] = useState("");
  const [amount, setAmount] = useState("");

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
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const numbersArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPhoneNumbers(numbersArray);
    });

    return () => unsubscribe();
  }, [userEmail]);

  useEffect(() => {
    if (phone && phoneNumbers.length > 0) {
      const selected = phoneNumbers.find((item) => item.phone === phone);
      if (selected) {
        setWithdrawLimit(selected.withdrawLimit);
        setDailyWithdraw(selected.dailyWithdraw);
        setAmount(selected.amount);
      }
    }
  }, [phone, phoneNumbers]);

  const handleWalletAdd = async () => {
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
        type: "استلام",
        date: new Date().toISOString().split("T")[0],
      });

      await updateDoc(userRef, {
        wallet: Number(userData.wallet) + Number(operationVal),
        cash: Number(userData.cash) - Number(operationVal),
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
          amount: Number(numberData.amount) + Number(operationVal),
          withdrawLimit: Number(numberData.withdrawLimit) - Number(operationVal),
          dailyWithdraw: Number(numberData.dailyWithdraw) - Number(operationVal),
        });
      }

      alert("تم اتمام العملية بنجاح");
      setPhone("");
      setCommation("");
      setOperationVal("");
    }
  };

  return (
    <div className={openWallet ? "operationContainer active" : "operationContainer"}>
      <div className="conatainerHead">
        <button className={styles.closeBtn} onClick={() => setOpenWallet(false)}>
          <MdOutlineKeyboardArrowLeft />
        </button>
        <h2>عملية استلام</h2>
      </div>
      <div className="operationBox">
        <div className="operationsContent">
          <div className="inputContainer">
            <label>ادخل رقم الشريحة :</label>
            <input
              type="number"
              list="numbers"
              onChange={(e) => setPhone(e.target.value)}
              value={phone}
              placeholder="ابحث عن رقم المحفظة"
            />
            <datalist id="numbers">
              {phoneNumbers.map((item) => (
                <option key={item.id} value={item.phone} />
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
                value={Number(operationVal) - Number(commation)}
                placeholder="0"
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="amounts">
            <div className="inputContainer">
              <label>الليمت الشهري المتاح للاستلام :</label>
              <input
                type="number"
                value={Number(withdrawLimit)}
                placeholder="0"
                disabled
                readOnly
              />
            </div>
            <div className="inputContainer">
              <label>الليمت اليومي المتاح للاستلام :</label>
              <input
                type="number"
                value={Number(dailyWithdraw)}
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
        <button className="operationBtn" onClick={handleWalletAdd}>اكمل العملية</button>
      </div>
    </div>
  );
}

export default Wallet;
