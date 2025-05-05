"use client";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../../app/firebase";
import { addDoc, collection } from "firebase/firestore";

function AddPage({add, setAdd}) {
    const [form, setForm] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('Every day')

    useEffect(() => {
        if(add) {
            setTimeout(() => {
                setForm(true)
            }, 500);
        }
    },[add])

    const handleCloseAdd = () => {
        setForm(false)
        setAdd(false)
    }

    const handleAddHabit = async() =>{
        if(name !== '' && description !== '') {
            await addDoc(collection(db, 'habits'), {name, description, type, email: localStorage.getItem('email')})
            alert('A new habit has been added')
            setName('')
            setDescription('')
            setType('Every day')
        }
    }

    return(
        <div className={add ? `${styles.shadowBox} ${styles.open}` : `${styles.shadowBox}`}>
            <div className={form ? `${styles.add} ${styles.show}` : `${styles.add}`}>
                <div className={styles.title}>
                    <h2>Start a new habit</h2>
                    <button onClick={handleCloseAdd}><IoIosCloseCircle/></button>
                </div>
                <div className={styles.formContainer}>
                    <div className={styles.form}>
                        <div className="inputContainer">
                            <label htmlFor="">Name: </label>
                            <input type="text" value={name} placeholder="Type a habit name" onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">Description: </label>
                            <input type="text" value={description} placeholder="Description a habit" onChange={(e) => setDescription(e.target.value)}/>
                        </div>
                        <div className="inputContainer">
                            <label htmlFor="">Intervals: </label>
                            <select value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="Every day">Every day</option>
                                <option value="Every month">Every month</option>
                                <option value="Every year">Every year</option>
                            </select>
                        </div>
                        <button onClick={handleAddHabit}>Add</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default AddPage;