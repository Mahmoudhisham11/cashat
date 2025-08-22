'use client';
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import avatar from "../../public/image/Avatar-Profile-Vector-removebg-preview.png";
import Image from "next/image";
import { FaArrowUp, FaArrowDown, FaRegTrashAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import { BiMemoryCard } from "react-icons/bi";
import { FaArchive } from "react-icons/fa";
import Nav from "../Nav/page";
import Wallet from "../Wallet/page";
import Cash from "../Cash/page";
import { db } from "../../app/firebase";
import {
  collection,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  addDoc
} from "firebase/firestore";
import { useRouter } from "next/navigation";

function Main() {
  const router = useRouter();
  const [openWallet, setOpenWallet] = useState(false);
  const [openCash, setOpenCash] = useState(false);
  const [active, setActive] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [cash, setCash] = useState('');
  const [profit, setProfit] = useState('');
  const [operations, setOperations] = useState([]);
  const [nums, setNums] = useState([]);
  const [theme, setTheme] = useState('light');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [lockMoney, setLockMoney] = useState(false);

  // THEME CONTROLE
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.className = savedTheme;
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.className = newTheme;
  };
  // GET LOCALSTORAGE DATA
  useEffect(() => {
    const storageName = localStorage.getItem("name");
    const storageEmail = localStorage.getItem("email");
    if (storageName) {
      setUserName(storageName);
      setUserEmail(storageEmail);
    }
  }, []);
  // USER SUBSCRIBTION
  useEffect(() => {
    if (!userEmail) return;
    const q = query(collection(db, 'users'), where('email', '==', userEmail));
    const userSubscribe = onSnapshot(q, (querySnapshot) => {
      const dataDoc = querySnapshot.docs[0];
      const data = dataDoc.data();

      if (!data.isSubscribed) {
        localStorage.clear();
        window.location.reload();
      }

      setCash(data.cash);
      setLockMoney(data.lockMoney || false);
      setHideAmounts(data.lockMoney || false);
    });

    const numQ = query(collection(db, 'numbers'), where('userEmail', '==', userEmail));
    const unSubscribeNum = onSnapshot(numQ, (querySnapshot) => {
      const numArray = [];
      querySnapshot.forEach((doc) => {
        numArray.push({ ...doc.data(), id: doc.id });
      });
      setNums(numArray);
    });

    const opQ = query(collection(db, 'operations'), where('userEmail', '==', userEmail));
    const unSubscribeOp = onSnapshot(opQ, (querySnapshot) => {
      const opArray = [];
      querySnapshot.forEach((doc) => {
        opArray.push({ ...doc.data(), id: doc.id });
      });
      setOperations(opArray);
    });

    return () => { userSubscribe(); unSubscribeOp(); unSubscribeNum(); };
  }, [userEmail]);
  // PROFIT & TOTAL
  useEffect(() => {
    const subTotal = operations.reduce((acc, op) => acc + Number(op.commation), 0);
    const walletTotal = nums.reduce((acc, num) => acc + Number(num.amount), 0);
    setProfit(subTotal);
    setWallet(walletTotal);
  }, [operations, nums]);
  // HIDE AMOUNTS
  const handleToggleAmounts = async () => {
    if (!userEmail) return;

    const q = query(collection(db, "users"), where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, "users", userDoc.id);
    const data = userDoc.data();

    if (data.lockMoney) {
      const userPassword = prompt("ادخل كلمة المرور لعرض البيانات");
      if (userPassword === data.lockPassword) {
        await updateDoc(userRef, { lockMoney: false });
        setHideAmounts(false);
      } else {
        alert("كلمة المرور غير صحيحة ❌");
      }
    } else {
      await updateDoc(userRef, { lockMoney: true });
      setHideAmounts(true);
    }
  };
  const formatValue = (value) => hideAmounts ? "***" : `${value}.00 جنية`;
  // DLELTE OPERATION
  const handelDelete = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "هل أنت متأكد من حذف العملية؟ سيتم استرجاع الرصيد والليميت والكاش المرتبطين بهذه العملية."
      );
      if (!confirmDelete) return;

      console.log("start delete process");

      // جلب العملية
      const opRef = doc(db, "operations", id);
      const opSnap = await getDoc(opRef);
      if (!opSnap.exists()) {
        alert("⚠️ العملية غير موجودة.");
        return;
      }

      const operationData = opSnap.data();
      const { phone, operationVal, type, userEmail } = operationData;
      const value = Number(operationVal) || 0;

      // جلب بيانات المستخدم
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", userEmail)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        alert("⚠️ لم يتم العثور على المستخدم.");
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userRef = doc(db, "users", userDoc.id);
      const userData = userDoc.data();

      if (userData.lockDaily === true) {
        const password = prompt("🔒 يرجى إدخال كلمة المرور لحذف العملية:");
        if (password !== userData.lockPassword) {
          alert("❌ كلمة المرور غير صحيحة.");
          return;
        }
      }

      // جلب doc الخط (number) المرتبط بالعملية
      const nq = query(
        collection(db, "numbers"),
        where("phone", "==", phone),
        where("userEmail", "==", userEmail)
      );
      const nSnapshot = await getDocs(nq);

      if (nSnapshot.empty) {
        alert("⚠️ لم يتم العثور على الخط المرتبط بهذه العملية.");
        return;
      }

      const numberDoc = nSnapshot.docs[0];
      const numberRef = doc(db, "numbers", numberDoc.id);
      const numberData = numberDoc.data();

      // القيم الحالية
      const oldAmount = Number(numberData.amount) || 0;
      const oldDailyWithdraw = Number(numberData.dailyWithdraw) || 0;
      const oldDailyDeposit = Number(numberData.dailyDeposit) || 0;
      const oldWithdrawLimit = Number(numberData.withdrawLimit) || 0;
      const oldDepositLimit = Number(numberData.depositLimit) || 0;
      const oldCash = Number(userData.cash) || 0;

      if (type === "ارسال") {
        // تحديث رصيد الخط
        const newAmount = oldAmount + value;
        const newDailyDeposit = oldDailyDeposit + value;
        const newDepositLimit = oldDepositLimit + value;

        await updateDoc(numberRef, {
          amount: newAmount,
          dailyDeposit: newDailyDeposit,
          depositLimit: newDepositLimit,
        });

        // 👇 هنا التعديل: الكاش يقل بدل ما يزيد
        const newCash = oldCash - value;
        if (newCash < 0) {
          alert("⚠️ لا يمكن حذف العملية لأن الكاش الناتج سيكون بالسالب.");
          return;
        }
        await updateDoc(userRef, { cash: newCash });

      } else if (type === "استلام") {
        const newAmount = oldAmount - value;
        if (newAmount < 0) {
          alert("⚠️ لا يمكن حذف العملية لأن الرصيد الناتج سيكون بالسالب.");
          return;
        }
        const newDailyWithdraw = oldDailyWithdraw + value;
        const newWithdrawLimit = oldWithdrawLimit + value;

        await updateDoc(numberRef, {
          amount: newAmount,
          dailyWithdraw: newDailyWithdraw,
          withdrawLimit: newWithdrawLimit,
        });

        // 👇 هنا التعديل: الكاش يزيد بدل ما يقل
        await updateDoc(userRef, { cash: oldCash + value });

      } else {
        alert("⚠️ نوع العملية غير معروف.");
        return;
      }

      // حذف العملية
      await deleteDoc(opRef);

      alert("✅ تم حذف العملية وإرجاع الرصيد والليميت والكاش بنجاح.");
      console.log("delete process finished");
    } catch (error) {
      console.error("❌ خطأ أثناء حذف العملية:", error);
      alert("❌ حدث خطأ أثناء حذف العملية.");
    }
  };

  // DELETE DAY
  const handelDeleteDay = async () => {
    const confirmDelete = window.confirm("هل أنت متأكد من تقفيل اليوم؟ سيتم نقل العمليات إلى الأرشيف ومسحها من القائمة.");
    if (!confirmDelete) return;
    try {
      const userEmail = localStorage.getItem('email');
      const opQ = query(collection(db, 'operations'), where('userEmail', '==', userEmail));
      const querySnapshot = await getDocs(opQ);
      if (querySnapshot.empty) {
        alert("لا توجد عمليات اليوم.");
        return;
      }
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        await addDoc(collection(db, 'reports'), { ...data, archivedAt: new Date().toISOString() });
        await deleteDoc(doc(db, 'operations', docSnap.id));
      }
      alert("تم تقفيل اليوم بنجاح ✅");
    } catch (error) {
      console.error("Error during end of day operations:", error);
      alert("حدث خطأ أثناء تقفيل اليوم ❌");
    }
  };
  return (
    <div className={styles.main}>
      <Wallet openWallet={openWallet} setOpenWallet={setOpenWallet} />
      <Cash openCash={openCash} setOpenCash={setOpenCash} />
      <Nav />
      <div className={styles.title}>
        <div className={styles.text}>
          <Image src={avatar} className={styles.avatar} alt="avatar" />
          <h2>مرحبا, <br /> {userName} 👋</h2>
        </div>
        <div className={styles.leftActions}>
          <button onClick={handleToggleAmounts}>
            {hideAmounts ? <FaEyeSlash /> : <FaEye />}
          </button>
          <label className="switch">
            <span className="sun">🌞</span>
            <span className="moon">🌙</span>
            <input
              type="checkbox"
              className="input"
              onChange={toggleTheme}
              checked={theme === 'dark'}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      <div className={styles.balanceContainer}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceContent}>
            <div className={styles.balanceHead}><p>المتاح بالمحافظ</p><p>{formatValue(wallet)}</p></div>
            <div className={styles.balanceHead}><p>الارباح</p><p>{formatValue(profit)}</p></div>
            <div className={styles.balanceHead}><p>المتاح النقدي</p><p>{formatValue(cash)}</p></div>
          </div>
          <div className={styles.balanceBtns}>
            <button onClick={() => setOpenCash(true)}><span><FaArrowUp /></span><span>ارسال</span></button>
            <button onClick={() => setOpenWallet(true)}><span><FaArrowDown /></span><span>استلام</span></button>
            <button onClick={() => router.push('/Numbers')}><span><BiMemoryCard /></span><span>الخطوط</span></button>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.contentTitle}>
          <h2>العمليات اليومية</h2>
          <button onClick={handelDeleteDay}><FaArchive /></button>
        </div>
        <div className={styles.operations}>
          {operations.map((operation, index) => (
            <div
              key={operation.id}
              onClick={() => setActive(active === index ? null : index)}
              className={active === index ? `${styles.card} ${styles.active}` : styles.card}
            >
              <div className={styles.cardHead}>
                <h3>{operation.phone}</h3>
                <div className={styles.type}>
                  <strong>{operation.type}</strong>
                  <button onClick={() => handelDelete(operation.id)}><FaRegTrashAlt /></button>
                </div>
              </div>
              <hr />
              <div className={styles.cardBody}>
                <strong>قيمة العملية : {operation.operationVal} جنية</strong>
                <strong>عمولة العملية : {operation.commation} جنية</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Main;
