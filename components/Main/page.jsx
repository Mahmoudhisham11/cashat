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

  useEffect(() => {
    const storageName = localStorage.getItem("name");
    const storageEmail = localStorage.getItem("email");
    if (storageName) {
      setUserName(storageName);
      setUserEmail(storageEmail);
    }
  }, []);

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

  useEffect(() => {
    const subTotal = operations.reduce((acc, op) => acc + Number(op.commation), 0);
    const walletTotal = nums.reduce((acc, num) => acc + Number(num.amount), 0);
    setProfit(subTotal);
    setWallet(walletTotal);
  }, [operations, nums]);

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

const handelDelete = async (id) => {
  try {
    console.log('test');

    const opRef = doc(db, 'operations', id);
    const opSnap = await getDoc(opRef);
    if (!opSnap.exists()) {
      alert("⚠️ العملية غير موجودة.");
      return;
    }

    const operationData = opSnap.data();
    const { phone, operationVal, type, userEmail: operationUserEmail } = operationData;

    // جلب بيانات المستخدم للتأكد من حالة القفل
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', operationUserEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      const lockDaily = userData.lockDaily;

      if (lockDaily === true) {
        const password = prompt("🔒 يرجى إدخال كلمة المرور لحذف العملية:");
        if (password !== userData.lockPassword) {
          alert("❌ كلمة المرور غير صحيحة.");
          return;
        }
      }
    }

    // تعديل الرصيد
    const nq = query(
      collection(db, 'numbers'),
      where('phone', '==', phone),
      where('userEmail', '==', operationUserEmail)
    );
    const nSnapshot = await getDocs(nq);

    if (!nSnapshot.empty) {
      const numberDoc = nSnapshot.docs[0];
      const numberRef = doc(db, 'numbers', numberDoc.id);
      const numberData = numberDoc.data();
      const oldAmount = Number(numberData.amount);
      const value = Number(operationVal);
      let newAmount;

      if (type === "ارسال") {
        newAmount = oldAmount + value;
      } else if (type === "استلام") {
        newAmount = oldAmount - value;
        if (newAmount < 0) {
          alert("⚠️ لا يمكن حذف العملية لأن الرصيد الناتج سيكون بالسالب.");
          return;
        }
      } else {
        alert("⚠️ نوع العملية غير معروف.");
        return;
      }

      await updateDoc(numberRef, { amount: newAmount });
    }

    // حذف العملية
    await deleteDoc(opRef);
    alert("✅ تم حذف العملية بنجاح.");
  } catch (error) {
    console.error("❌ خطأ أثناء حذف العملية:", error);
    alert("❌ حدث خطأ أثناء حذف العملية.");
  }
};



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
                <button onClick={() => handelDelete(operation.id)}><FaRegTrashAlt /></button>
              </div>
              <hr />
              <div className={styles.cardBody}>
                <strong>نوع العملية : {operation.type}</strong>
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
