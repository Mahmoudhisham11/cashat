"use client";
import styles from "./style.module.css";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { FaWallet } from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";
import { GiMoneyStack } from "react-icons/gi";
import { useEffect, useState } from "react";
import { db } from "../../app/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

function SliderCards({wallet, cash}) {
    const [userEmail, setUserEamil] = useState('')
    const [total, setTotla] = useState('')

    useEffect(() => {
        if(typeof window !== "undefined") {
            const storageEmail = localStorage.getItem('email')
            if(storageEmail) {
                setUserEamil(storageEmail)
            }
        }
        const q = query(collection(db, 'operations'), where('userEmail', '==', userEmail))
        const onSubscribe = onSnapshot(q, (querySnapshot) => {
            let subTotal = 0
            querySnapshot.forEach((doc) => {
                subTotal += Number(doc.data().profit || 0)
            })
            setTotla(subTotal)
        })
        return () => onSubscribe()
    }, [userEmail])

    return(
        <div className={styles.cards}>
            <div className={styles.cardTitle}>
                <h2>الرصيد الحالي</h2>
            </div>
            <div className={styles.swiperContainer}>
                <Swiper
                    spaceBetween={20}
                    slidesPerView={1.5}
                    breakpoints={{
                        640: {slidesPerView: 1.5},
                        768: {slidesPerView: 1.5},
                        1024: {slidesPerView: 5}
                    }}
                    style={{padding: "10px"}}
                >
                    <SwiperSlide>
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <p><FaWallet/></p>
                            </div>
                            <div className={styles.cardBody}>
                                <p>رصيد المحفطة</p>
                                <strong>{userEmail === 'abdulrhmansalahmohamed@gmail.com' ? 0 : <>{wallet}</>} جنية</strong>
                            </div>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <p><GiTakeMyMoney/></p>
                            </div>
                            <div className={styles.cardBody}>
                                <p>رصيد الكاش</p>
                                <strong>{userEmail === 'abdulrhmansalahmohamed@gmail.com' ? 0 : <>{cash}</>} جنية</strong>
                            </div>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <p><GiMoneyStack/></p>
                            </div>
                            <div className={styles.cardBody}>
                                <p>الربح اليومي</p>
                                <strong>{userEmail === 'abdulrhmansalahmohamed@gmail.com' ? 0 : <>{total}</>} جنية</strong>
                            </div>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>
        </div>
    )
}

export default SliderCards;