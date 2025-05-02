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
import Nav from "../components/Nav/page";
import Add from "../components/Add/page";
import { db } from "../firebase";
import { collection, deleteDoc, onSnapshot, query, where, doc } from "firebase/firestore";

function Main() {
    const [name, setName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [coin, setCoin] = useState(0)
    const [active, setActive] = useState(null)
    const [add, setAdd] = useState(false)
    const [habits, setHabits] = useState([])
    const colors = ['#b8eb6c','#1f3da0', '#f7cd63', '#1b1b1b']
    const test = ['1', '2', '3', '5','6','78']

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
        return () => unSubscribe()
    },[userEmail])

    const hanleDelete = async(id) => {
        await deleteDoc(doc(db, 'habits', id))
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
                                return(
                                    <p key={index}>{day.dayNumber}</p>
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