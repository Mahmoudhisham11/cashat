"use client";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Image from "next/image";
import coinImage from "../../public/images/IMG_7213.PNG";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Mousewheel, Keyboard, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { IoIosArrowDown } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { MdDone } from "react-icons/md";
import Nav from "../components/Nav/page";
import Add from "../components/Add/page";
import { db } from "../firebase";
import { collection, deleteDoc, onSnapshot, query, where, doc, getDocs, updateDoc, addDoc } from "firebase/firestore";

function Main() {
    const [name, setName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [coin, setCoin] = useState(0)
    const [active, setActive] = useState(null)
    const [add, setAdd] = useState(false)
    const [habits, setHabits] = useState([])
    const [completedDays, setCompletedDays] = useState([])
    const colors = ['#b8eb6c','#1f3da0', '#f7cd63', '#1b1b1b']

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()
    const dayInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = []
    for(let day = 1; day <= dayInMonth; day++) {
        const date = new Date( currentYear, currentMonth, day)
        const dayName = date.toLocaleDateString('en-US', {weekday: 'short'})
        days.push({
            dayNumber: day,
            dayName: dayName,
            isToDay: day === currentDay
        })
    }

    useEffect(() => {
        if(typeof window !== 'undefined') {
            const userName = localStorage.getItem('userName')
            const email = localStorage.getItem('email')
            if(userName) {
                setName(userName)
                setUserEmail(email)
            }
        }
        const q = query(collection(db, 'habits'), where('email', '==', userEmail))
        const unSubscribe = onSnapshot(q, (querySnapShot) => {
            const habitsArrya = []
            querySnapShot.forEach((doc) => {
                habitsArrya.push({...doc.data(), id: doc.id})
            })
            setHabits(habitsArrya)
        })
        const clickedDaysQ = query(collection(db, 'completedHabits'), where('email', '==', userEmail))
        const unSubscribeClikcedDays = onSnapshot(clickedDaysQ, (querySnapShot) => {
            if(!querySnapShot.empty) {
                const habitsDays = {}
                querySnapShot.forEach((doc) => {
                    const data = doc.data()
                    habitsDays[data.habitName] = data.clickedDays || []
                })
                setCompletedDays(habitsDays)
            }
        })
        
        return () => {unSubscribe(), unSubscribeClikcedDays()}
    },[userEmail])

    const hanleDelete = async(id) => {
        await deleteDoc(doc(db, 'habits', id))
    }

    const hableCompletedDays = async(dayNumber, habitName) => {
        const q = query(collection(db, 'completedHabits'), where('habitName', '==', habitName), where('email', '==', userEmail))
        const querySnapShot = await getDocs(q)
        if(!querySnapShot.empty) {
            const habitDoc = querySnapShot.docs[0]
            const docRef = doc(db, 'completedHabits', habitDoc.id)
            const data = habitDoc.data()
            const currntClickedDays = data.clickedDays || []
            if(currntClickedDays.includes(dayNumber)) return
            const updatedDays = [...currntClickedDays, dayNumber]
            const currentCount = habitDoc.data().clickCount || 1
            await updateDoc(docRef, {
                clickCount: currentCount + 1,
                clickedDays: updatedDays
            })
        }else {
            await addDoc(collection(db, 'completedHabits'), {
                habitName: habitName,
                clickedDays: [dayNumber],
                clickCount: 1,
                email: userEmail
            })
        }
    }

    return(
        <div className="main">
            <div className={styles.header}>
                <div className={styles.leftSide}>
                    <h2>Welcome, <span style={{textTransform: 'capitalize'}}>{name}</span></h2>
                    <p>{userEmail}</p>
                </div>
                <div className={styles.rightSide}>
                    <div className={styles.imageContainer}>
                        <Image src={coinImage} fill style={{objectFit: 'cover'}} alt="coin image"/>
                    </div>
                    <div className={styles.numContainer}>
                        <strong>{coin}</strong>
                    </div>
                </div>
            </div>
            <div className={styles.sliderContainer}>
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={5}
                    slidesPerView={6}
                    breakpoints={{
                        640: {slidesPerView: 6},
                        768: {slidesPerView: 6},
                        1024: {slidesPerView: 20}
                    }}
                    className={styles.swiper}
                    >
                        {days.map((day, index) => {
                            return(
                                <SwiperSlide key={index}>
                                    <div className={styles.dayContainer} style={{backgroundColor: day.isToDay ? 'var(--black-color)' : 'var(--main-color)', color: day.isToDay ? 'whitesmoke' : 'black'}}>
                                        <strong>{day.dayNumber}</strong>
                                        <strong>{day.dayName}</strong>
                                    </div>
                                </SwiperSlide>
                            )
                        })}
                </Swiper>
            </div>
            <div className={styles.habitContainer}>
                <div className={styles.title}>
                    <h2>my habits</h2>
                </div>
                {habits.map((habit, index) => {
                    return(
                    <div key={habit.id} style={{backgroundColor: colors[index % colors.length]}} className={active === index ? `${styles.card} ${styles.open}` : `${styles.card}`} onClick={() => setActive(active === index ? null : index)}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                <h2>
                                    <span onClick={() => hanleDelete(habit.id)}><MdDelete/></span>
                                    <span>{habit.name}</span>
                                </h2>
                                <strong>{habit.type}</strong>
                            </div>
                            <h2><IoIosArrowDown/></h2>
                        </div>
                        <div className={styles.cardBody}>
                            {days.map((day, index) => {
                                const isPast = day.dayNumber < currentDay
                                const isFuture = day.dayNumber > currentDay
                                const isCompleted = (completedDays[habit.name] || []).includes(day.dayNumber)
                                return(
                                    <button key={index}
                                    disabled={isPast || isFuture || isCompleted}
                                    style={{
                                        cursor: isCompleted || isPast || isFuture ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={() => hableCompletedDays(day.dayNumber, habit.name)}
                                    >
                                        {(completedDays[habit.name] || []).includes(day.dayNumber) ? 
                                            <MdDone/>
                                            :
                                            <>{day.dayNumber}</>
                                        }
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    )
                })}
                
            </div>
            <Add add={add} setAdd={setAdd}/>
            <Nav add={add} setAdd={setAdd}/>
        </div>
    )
}

export default Main;