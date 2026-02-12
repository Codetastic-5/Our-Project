import { initializeApp } from "firebase/app";
import { getAuth, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvm9r7AO2N7XQqin9_JZ_M7bm8Rx7WCfs",
  authDomain: "smart-loyalty-4ed01.firebaseapp.com",
  projectId: "smart-loyalty-4ed01",
  storageBucket: "smart-loyalty-4ed01.firebasestorage.app",
  messagingSenderId: "253917235804",
  appId: "1:253917235804:web:3d0421fe14a71d2deaf499",
  measurementId: "G-DY7FQ9CK87"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});
export const db = getFirestore(app);
