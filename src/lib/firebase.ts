import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLdqNqTFPFe1djCdqNwsiGRvJ6DDt0E7o",
  authDomain: "precificacao-babyworld.firebaseapp.com",
  projectId: "precificacao-babyworld",
  storageBucket: "precificacao-babyworld.firebasestorage.app",
  messagingSenderId: "518175448950",
  appId: "1:518175448950:web:a702d90c6b287bbc3be457",
  measurementId: "G-PB8D05JWYB"
};

// ✅ primeiro config
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

// ✅ depois serviços
export const db = getFirestore(app);
export const auth = getAuth(app);