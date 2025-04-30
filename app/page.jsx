"use client";
import styles from "./styles.module.css";
import Image from "next/image";
import Link from "next/link";
import logo from "../public/images/IMG_7211.PNG"
import { useEffect, useRef } from "react";

export default function Home() {

  return (
    <div className="main">
      <div className={styles.loadingContainer}>
        <div className={styles.top}>
          <h2><span>Build health</span> <br /> <span>habits with us</span></h2>
        </div>
        <div className={styles.middle}>
          <Image src={logo} fill style={{objectFit: "cover"}} alt="logo image"/>
        </div>
        <div className={styles.bottom}>
          <Link href={"/login"} className={styles.loadingLink}>Get started</Link>
          <Link href={"/login"} className={styles.accountLink}>I have an account</Link>
        </div>
      </div>
    </div>
  );
}