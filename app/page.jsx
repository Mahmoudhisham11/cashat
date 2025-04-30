"use client"
import Image from "next/image";
import Link from "next/link";
import Login from "./components/Login/page"
import Main from "./components/Main/page"
import { useEffect, useState } from "react";

export default function Home() {
  const [logedin, setLogedin] = useState(false)
  useEffect(() => {
    if(typeof window !== "undefined") {
      const email = localStorage.getItem("email")
      if(email) {
        setLogedin(true)
      }else {
        setLogedin(false)
      }
    }
  }, [])

  return (
    <div className="main">
      {logedin ? 
          <Main/>
        :
        <Login/>
      }
    </div>
  );
}