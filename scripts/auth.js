// ==============================
//  Firebase setup (module v9+)
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

console.log("auth.js loaded");

// Firebase Config
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

// Helper: email → Firebase key
function emailKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}

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

  const key = emailKey(OWNER_EMAIL);

  // Store data the entire app expects
  localStorage.setItem("currentUser", JSON.stringify(ownerUser));
  localStorage.setItem("flop_name", ownerUser.name);
  localStorage.setItem("flop_email", ownerUser.email);
  localStorage.setItem("flop_role", ownerUser.role);
  localStorage.setItem("flop_userKey", key);

  console.log("OWNER LOGIN SUCCESS — redirecting");
  window.location.href = "rooms.html";
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

  // Normal login using Firebase DB
  const key = emailKey(email);
  const userRef = ref(db, `users/${key}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    alert("Account not found. Ask Rhyder for approval.");
    return;
  }

  const user = snap.val();

  if (!user.password || user.password !== password) {
    alert("Incorrect password.");
    return;
  }

  if (!user.approved) {
    alert("Your account has not been approved yet.");
    return;
  }

  // Store everything the rest of the site requires
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("flop_name", user.name);
  localStorage.setItem("flop_email", user.email);
  localStorage.setItem("flop_role", user.role || "user");
  localStorage.setItem("flop_userKey", key);

  console.log("Login OK — redirecting");
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
    alert("You must use your WILLISISD school email.");
    return;
  }

  const key = emailKey(email);

  await set(ref(db, `pendingAccounts/${key}`), {
    name,
    email,
    password,
    reason,
    approved: false,
    submittedAt: Date.now()
  });

  document.getElementById("signup-message").textContent =
    "Account request submitted. It will show up in the admin panel.";
});
