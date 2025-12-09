// Firebase bootstrap for chatroom.best
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  remove
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Your web app's Firebase configuration (from your snippet)
const firebaseConfig = {
  apiKey: "AIzaSyAHKDJWehHiU_noBMf4w1PRV-uGM4tjS4s",
  authDomain: "chatroom-770b2.firebaseapp.com",
  databaseURL: "https://chatroom-770b2-default-rtdb.firebaseio.com",
  projectId: "chatroom-770b2",
  storageBucket: "chatroom-770b2.firebasestorage.app",
  messagingSenderId: "222722805848",
  appId: "1:222722805848:web:ed2e783808d86ea8253a2d",
  measurementId: "G-B4D1YQGERF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

function sendMessage(message) {
  return push(messagesRef, message);
}

function clearMessages() {
  return remove(messagesRef);
}

export { app, db, messagesRef, sendMessage, clearMessages, onChildAdded };
