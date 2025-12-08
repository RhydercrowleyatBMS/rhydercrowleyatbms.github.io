export const firebaseConfig = {
  apiKey: "AIzaSyAHKDJWehHiU_noBMf4w1PRV-uGM4tjS4s",
  authDomain: "chatroom-770b2.firebaseapp.com",
  databaseURL: "https://chatroom-770b2-default-rtdb.firebaseio.com",
  projectId: "chatroom-770b2",
  storageBucket: "chatroom-770b2.firebasestorage.app",
  messagingSenderId: "222722805848",
  appId: "1:222722805848:web:9e5ed844839c7f57253a2d",
  measurementId: "G-DLFYMPHE9F"
};

// 2) Do not change below this unless you know what you’re doing
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
