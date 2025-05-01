import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyCc3cyMzLKRzAMX7Saunn9-StFSasSf0wU",
    authDomain: "betterme-ec123.firebaseapp.com",
    projectId: "betterme-ec123",
    storageBucket: "betterme-ec123.firebasestorage.app",
    messagingSenderId: "1092066537793",
    appId: "1:1092066537793:web:1c7ffc344483d893ce31c0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)