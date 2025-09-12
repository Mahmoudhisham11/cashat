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
import abod from "../../public/image/TXSC8094.JPG"
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
  addDoc,
  orderBy
} from "firebase/firestore";
import { useRouter } from "next/navigation";

function Main() {
  const router = useRouter();
  const [openWallet, setOpenWallet] = useState(false);
  const [openCash, setOpenCash] = useState(false);
  const [active, setActive] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [wallet, setWallet] = useState(0);
  const [cash, setCash] = useState(0);
  const [profit, setProfit] = useState(0);
  const [capital, setCapital] = useState(0);
  const [operations, setOperations] = useState([]);
  const [nums, setNums] = useState([]);
  const [theme, setTheme] = useState('light');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [lockMoney, setLockMoney] = useState(false);

  // THEME CONTROL
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

  // SUBSCRIBE TO USER / NUMBERS / OPERATIONS (live)
  useEffect(() => {
    if (!userEmail) return;

    const userQ = query(collection(db, 'users'), where('email', '==', userEmail));
    const unsubUser = onSnapshot(userQ, (qs) => {
      if (qs.empty) return;
      const dataDoc = qs.docs[0];
      const data = dataDoc.data();

      if (!data.isSubscribed) {
        localStorage.clear();
        window.location.reload();
      }

      setCash(Number(data.cash) || 0);
      setLockMoney(data.lockMoney || false);
      setHideAmounts(data.lockMoney || false);
    });

    const numQ = query(collection(db, 'numbers'), where('userEmail', '==', userEmail));
    const unsubNum = onSnapshot(numQ, (qs) => {
      const arr = [];
      qs.forEach(d => arr.push({ ...d.data(), id: d.id }));
      setNums(arr);
    });

    // operations ordered by createdAt desc (الأحدث أولًا)
    const opQ = query(
  collection(db, 'operations'),
  where('userEmail', '==', userEmail)
);

const unsubOp = onSnapshot(opQ, (qs) => {
  const arr = qs.docs.map((d) => ({ ...d.data(), id: d.id }));

  // ترتيب: الأحدث createdAt الأول، ولو العملية قديمة مافيهاش createdAt تتحط في الآخر
  arr.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      const aTime = typeof a.createdAt.toMillis === "function"
        ? a.createdAt.toMillis()
        : a.createdAt.seconds * 1000;
      const bTime = typeof b.createdAt.toMillis === "function"
        ? b.createdAt.toMillis()
        : b.createdAt.seconds * 1000;
      return bTime - aTime; // تنازلي (الأحدث فوق)
    }
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    return 0;
  });

  setOperations(arr);
});

    return () => {
      try { unsubUser(); } catch (e) {}
      try { unsubNum(); } catch (e) {}
      try { unsubOp(); } catch (e) {}
    };
  }, [userEmail]);

  // CALCULATE PROFIT, WALLET TOTAL, CAPITAL
  useEffect(() => {
    const subTotal = operations.reduce((acc, op) => acc + Number(op.commation || 0), 0);
    const walletTotal = nums.reduce((acc, n) => acc + Number(n.amount || 0), 0);
    setProfit(subTotal);
    setWallet(walletTotal);
    setCapital(walletTotal + Number(cash || 0));
  }, [operations, nums, cash]);

  // HIDE / SHOW AMOUNTS (with lock password)
  const handleToggleAmounts = async () => {
    if (!userEmail) return;
    try {
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
    } catch (err) {
      console.error("Error toggling amounts:", err);
      alert("حدث خطأ أثناء محاولة تغيير حالة الأرصدة.");
    }
  };

  const formatValue = (value) => hideAmounts ? "***" : `${value}.00 جنية`;

  // helper to format createdAt safely
  const formatDate = (createdAt) => {
    if (!createdAt) return "-";
    try {
      // Firestore Timestamp has toDate()
      if (typeof createdAt.toDate === "function") {
        return createdAt.toDate().toLocaleString("ar-EG");
      }
      // old style object with seconds
      if (createdAt.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleString("ar-EG");
      }
      // fallback: assume it's a string/date
      return new Date(createdAt).toLocaleString("ar-EG");
    } catch (e) {
      return "-";
    }
  };

  // DELETE SINGLE OPERATION (with reverting amounts & checks)
  const handelDelete = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "هل أنت متأكد من حذف العملية؟ سيتم استرجاع الرصيد والليميت والكاش المرتبطين بهذه العملية."
      );
      if (!confirmDelete) return;

      // جلب العملية
      const opRef = doc(db, "operations", id);
      const opSnap = await getDoc(opRef);
      if (!opSnap.exists()) {
        alert("⚠️ العملية غير موجودة.");
        return;
      }

      const operationData = opSnap.data();
      const { phone, operationVal, type } = operationData;
      // Use operation's userEmail if present, else current userEmail
      const opUserEmail = operationData.userEmail || userEmail;
      const value = Number(operationVal) || 0;

      // جلب بيانات المستخدم
      const usersQuery = query(collection(db, "users"), where("email", "==", opUserEmail));
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
        where("userEmail", "==", opUserEmail)
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
        // لو العملية كانت إرسال -> نرجع رصيد الخط (يزيد)
        const newAmount = oldAmount + value;
        const newDailyDeposit = oldDailyDeposit + value;
        const newDepositLimit = oldDepositLimit + value;

        await updateDoc(numberRef, {
          amount: newAmount,
          dailyDeposit: newDailyDeposit,
          depositLimit: newDepositLimit,
        });

        // الكاش يقل بدل ما يزيد عند حذف إرسال (لأن لما كانت عملية إرسال الكاش نقص)
        const newCash = oldCash - value;
        if (newCash < 0) {
          alert("⚠️ لا يمكن حذف العملية لأن الكاش الناتج سيكون بالسالب.");
          return;
        }
        await updateDoc(userRef, { cash: newCash });

      } else if (type === "استلام") {
        // لو كانت استلام -> نخصم من رصيد الخط (لأن استلام كان زود الرصيد)
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

        // الكاش يزيد عند حذف استلام (لأن استلام كان زود الكاش سابقًا)
        await updateDoc(userRef, { cash: oldCash + value });

      } else {
        alert("⚠️ نوع العملية غير معروف.");
        return;
      }

      // حذف العملية
      await deleteDoc(opRef);

      alert("✅ تم حذف العملية وإرجاع الرصيد والليميت والكاش بنجاح.");
    } catch (error) {
      console.error("❌ خطأ أثناء حذف العملية:", error);
      alert("❌ حدث خطأ أثناء حذف العملية.");
    }
  };

  // DELETE DAY (move to reports then delete)
  const handelDeleteDay = async () => {
    const confirmDelete = window.confirm("هل أنت متأكد من تقفيل اليوم؟ سيتم نقل العمليات إلى الأرشيف ومسحها من القائمة.");
    if (!confirmDelete) return;
    try {
      const currentUserEmail = localStorage.getItem('email');
      const opQ = query(collection(db, 'operations'), where('userEmail', '==', currentUserEmail));
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
          {userEmail === "gamalaaaa999@gmail.com" ? 
           <Image src={abod} className={styles.avatar} alt="avatar" /> :
           <Image src={avatar} className={styles.avatar} alt="avatar" />
           }
          
          <h2>مرحبا, <br /> {userName} 👋</h2>
        </div>
        <div className={styles.leftActions}>
           <button onClick={handleToggleAmounts} title="إظهار/إخفاء الأرصدة">
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
          <div className={styles.totalBalance}><p>رأس المال</p><p>{formatValue(capital)}</p></div>
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
          <button onClick={handelDeleteDay} title="تقفيل اليوم"><FaArchive /></button>
        </div>
        <div className={styles.operations}>
          <table>
            <thead>
              <tr>
                <th>الرقم</th>
                <th>العملية</th>
                <th>المبلغ</th>
                <th>العمولة</th>
                <th>ملاحظات</th>
                <th>التاريخ</th>
                <th>حذف</th>
              </tr>
            </thead>
            <tbody>
              {operations.length > 0 ? (
                operations.map((operation) => (
                  <tr key={operation.id}>
                    <td>{operation.phone || "-"}</td>
                    <td>{operation.type || "-"}</td>
                    <td>{operation.operationVal ? `${operation.operationVal} جنية` : "-"}</td>
                    <td>{operation.commation ? `${operation.commation} جنية` : "-"}</td>
                    <td>{operation.notes || "-"}</td>
                    <td>{formatDate(operation.createdAt)}</td>
                    <td>
                      <button className={styles.action} onClick={() => handelDelete(operation.id)} title="حذف العملية">
                        <FaRegTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>لا توجد عمليات اليوم</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Main;
