// scripts/auth.js
import { db } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  push
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const SCHOOL_DOMAIN = "@willisisd.org";

function emailToKey(email) {
  // normalize email into a Firebase-safe key
  return email.trim().toLowerCase().replace(/\./g, ",");
}

function isWillisEmail(email) {
  return email.trim().toLowerCase().endsWith(SCHOOL_DOMAIN);
}

// LOGIN
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!isWillisEmail(email)) {
    loginMsg.textContent = "Email must be a willisisd.org address.";
    return;
  }

  const userKey = emailToKey(email);
  const userRef = ref(db, `users/${userKey}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    loginMsg.textContent = "No such account or it has not been approved yet.";
    return;
  }

  const user = snap.val();

  if (!user.approved) {
    loginMsg.textContent = "Your account is still pending approval.";
    return;
  }

  if (user.password !== password) {
    loginMsg.textContent = "Incorrect password.";
    return;
  }

  // store session info in localStorage
  localStorage.setItem("flop_email", user.email);
  localStorage.setItem("flop_name", user.name);
  localStorage.setItem("flop_role", user.role || "user");
  localStorage.setItem("flop_userKey", userKey);

  loginMsg.textContent = "Login successful. Redirecting to rooms...";
  setTimeout(() => {
    window.location.href = "rooms.html";
  }, 700);
});

// SIGNUP (account request)
const signupForm = document.getElementById("signup-form");
const signupMsg = document.getElementById("signup-message");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupMsg.textContent = "";

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const reason = document.getElementById("signup-reason").value.trim();

  if (!name.includes(" ")) {
    signupMsg.textContent = "Please use your real name: first + last.";
    return;
  }

  if (!isWillisEmail(email)) {
    signupMsg.textContent = "Email must be first.last@willisisd.org.";
    return;
  }

  if (password.length < 4) {
    signupMsg.textContent = "Pick a password with at least 4 characters.";
    return;
  }

  if (!reason) {
    signupMsg.textContent = "Please give a short reason.";
    return;
  }

  // Check if user already exists
  const userKey = emailToKey(email);
  const userRef = ref(db, `users/${userKey}`);
  const existingUser = await get(userRef);
  if (existingUser.exists()) {
    signupMsg.textContent = "That email already has an approved account.";
    return;
  }

  // Create pending request
  const pendingRef = ref(db, "pendingAccounts");
  const newRef = push(pendingRef);
  await set(newRef, {
    name,
    email,
    password, // WARNING: not secure, don't reuse real passwords
    reason,
    createdAt: Date.now()
  });

  signupMsg.textContent = "Request submitted. Wait for a mod/owner to approve you.";
  signupForm.reset();
});

// Go to rooms if already logged in
const gotoRoomsBtn = document.getElementById("goto-rooms-btn");
gotoRoomsBtn.addEventListener("click", () => {
  const name = localStorage.getItem("flop_name");
  if (!name) {
    loginMsg.textContent = "You are not logged in yet.";
    return;
  }
  window.location.href = "rooms.html";
});
