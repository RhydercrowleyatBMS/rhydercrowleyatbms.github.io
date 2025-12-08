// ==============================
//  Firebase setup (module v9+)
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, set, push, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

console.log("auth.js loaded");

// Firebase config
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==============================
//  OWNER BACKDOOR LOGIN
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
  console.log("Owner login success — redirecting");
  window.location.href = "rooms.html";
}

// Format email → Firebase key
function emailKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}

// ==============================
//  LOGIN HANDLER
// ==============================
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  console.log("Login attempt:", email);

  // Owner bypass
  if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
    ownerLoginSuccess();
    return;
  }

  // Normal login
  const key = emailKey(email);
  const userRef = ref(db, `users/${key}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    alert("Account not found.");
    return;
  }

  const user = snap.val();

  if (user.password !== password) {
    alert("Incorrect password.");
    return;
  }

  if (!user.approved) {
    alert("Your account is still pending approval.");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  window.location.href = "rooms.html";
});

// ==============================
//  SIGNUP HANDLER
// ==============================
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const reason = document.getElementById("signup-reason").value.trim();

  if (!email.endsWith("@willisisd.org")) {
    alert("Must use your WILLIS ISD school email.");
    return;
  }

  const key = emailKey(email);

  // Add to pending accounts
  await set(ref(db, `pendingAccounts/${key}`), {
    name,
    email,
    password,
    reason,
    approved: false,
    submittedAt: Date.now()
  });

  document.getElementById("signup-message").textContent =
    "Request submitted! A mod/owner must approve your account.";
});

// ==============================
//  BUTTON: Go to rooms
// ==============================
document.getElementById("goto-rooms-btn")?.addEventListener("click", () => {
  window.location.href = "rooms.html";
});
