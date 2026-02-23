import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzbg-jnGjGiRh9skuUM1KijmhgWO3wLFo",
  authDomain: "xmcreward.firebaseapp.com",
  projectId: "xmcreward",
  storageBucket: "xmcreward.firebasestorage.app",
  messagingSenderId: "1217508738",
  appId: "1:1217508738:web:d5bfbb9066bdd8ffa14b9b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
