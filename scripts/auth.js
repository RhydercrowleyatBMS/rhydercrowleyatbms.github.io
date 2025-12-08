// auth.js — full version with Firebase + owner bypass

// ==============================
//  Firebase setup (module v9+)
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

console.log("auth.js loaded");

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAHKDJWehHiU_noBMf4w1PRV-uGM4tjS4s",
  authDomain: "chatroom-770b2.firebaseapp.com",
  databaseURL: "https://chatroom-770b2-default-rtdb.firebaseio.com",
  projectId: "chatroom-770b2",
  storageBucket: "chatroom-770b2.firebasestorage.app",
  messagingSenderId: "222722805848",
  appId: "1:222722805848:web:9e5ed844839c7f57253a2d",
  measurementId: "G-DLFYMPHE9F"
};

// Init Firebase + DB
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==============================
//  HARD-CODED OWNER LOGIN
// ==============================

const OWNER_EMAIL = "rhyder.crowley@willisisd.org";
const OWNER_PASSWORD = "Rhyder1228";

function ownerLoginSuccess() {
  const ownerUser = {
    name: "Rhyder",
    email: OWNER_EMAIL,
    role: "owner",
    approved: true
  };

  localStorage.setItem("currentUser", JSON.stringify(ownerUser));
  console.log("Owner bypass login success, redirecting to rooms…");
  window.location.href = "rooms.html";
}

// ==============================
//  HELPER: email -> user key
// ==============================
function emailToKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}

// ==============================
//  HANDLE LOGIN FORM
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  if (!form) {
    console.error("loginForm not found in auth.html");
    return;
  }
  if (!emailInput || !passwordInput) {
    console.error("loginEmail or loginPassword input not found in auth.html");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    console.log("Login attempt for:", email);

    // ------------------------------
    //  OWNER BACKDOOR LOGIN
    // ------------------------------
    if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
      console.log("Owner credentials matched, using bypass.");
      ownerLoginSuccess();
      return;
    }

    // ------------------------------
    //  NORMAL LOGIN (Firebase users)
//  users/<emailKey> { name, email, password, role, approved }
// ------------------------------
    try {
      const userKey = emailToKey(email);
      const userRef = ref(db, `users/${userKey}`);
      const snap = await get(userRef);

      if (!snap.exists()) {
        alert("User not found. Ask Rhyder to create or approve your account.");
        console.warn("Login failed: user not found in /users:", userKey);
        return;
      }

      const user = snap.val();

      if (user.password !== password) {
        alert("Incorrect password.");
        console.warn("Login failed: bad password for:", email);
        return;
      }

      if (!user.approved) {
        alert("Your account has not been approved yet.");
        console.warn("Login failed: account not approved:", email);
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(user));
      console.log("Normal login success, redirecting to rooms…");
      window.location.href = "rooms.html";

    } catch (err) {
      console.error("Login error:", err);
      alert("Error logging in. Check console for details.");
    }
  });
});
