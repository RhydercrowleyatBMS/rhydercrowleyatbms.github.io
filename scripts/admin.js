// =============================
//  admin.js — CLEAN & FIXED
// =============================

import { db } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";


// =============================
//  DOM ELEMENTS
// =============================
const lockedPanel = document.getElementById("admin-locked");
const adminPanel = document.getElementById("admin-content");
const identityEl = document.getElementById("admin-identity");
const pendingList = document.getElementById("pending-list");


// =============================
//  USER LOGIN / ROLES
// =============================
const name = localStorage.getItem("flop_name");
const email = localStorage.getItem("flop_email");
const role = localStorage.getItem("flop_role");
const key = localStorage.getItem("flop_userKey");

if (!name || !email || !role) {
  window.location.href = "auth.html";
}

// Display identity
identityEl.textContent = `${name} (${role})`;


// =============================
//  FORCE CREATE OWNER IN FIREBASE IF MISSING
// =============================
async function ensureOwnerAccount() {
  if (role !== "owner") return;

  const ownerRef = ref(db, `users/${key}`);
  const snap = await get(ownerRef);

  if (!snap.exists()) {
    console.warn("Owner not found in Firebase — creating owner account...");

    await set(ownerRef, {
      name,
      email,
      role: "owner",
      approved: true,
      password: "OWNER-LOGIN-BYPASS" // placeholder, not used
    });
  }
}

await ensureOwnerAccount();


// =============================
//  RESTRICT ACCESS FOR NON-ADMINS
// =============================
function verifyPermission() {
  if (role === "owner" || role === "admin") {
    lockedPanel.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    lockedPanel.style.display = "block";
    adminPanel.style.display = "none";
  }
}

verifyPermission();


// =============================
//  LOAD ALL PENDING ACCOUNTS
// =============================
const pendingRef = ref(db, "pendingAccounts");

onValue(pendingRef, (snapshot) => {
  pendingList.innerHTML = "";

  if (!snapshot.exists()) {
    pendingList.innerHTML = "<p>No pending accounts.</p>";
    return;
  }

  snapshot.forEach((child) => {
    const data = child.val();

    const div = document.createElement("div");
    div.className = "pending-item";

    div.innerHTML = `
      <h4>${data.name}</h4>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Reason:</b> ${data.reason}</p>
      <button class="approve">Approve</button>
      <button class="deny">Deny</button>
    `;

    // Handle Approve
    div.querySelector(".approve").addEventListener("click", async () => {
      await approveAccount(child.key, data);
    });

    // Handle Deny
    div.querySelector(".deny").addEventListener("click", async () => {
      await denyAccount(child.key, data);
    });

    pendingList.appendChild(div);
  });
});


// =============================
//  APPROVE USER
// =============================
async function approveAccount(key, data) {
  const userRef = ref(db, `users/${key}`);
  const pendingRef = ref(db, `pendingAccounts/${key}`);

  await set(userRef, {
    name: data.name,
    email: data.email,
    password: data.password,
    role: "user",
    approved: true
  });

  await remove(pendingRef);

  alert(`Approved ${data.name}`);
}


// =============================
//  DENY USER
// =============================
async function denyAccount(key, data) {
  const pendingRef = ref(db, `pendingAccounts/${key}`);
  const deniedRef = ref(db, `deniedAccounts/${key}`);

  await set(deniedRef, {
    ...data,
    deniedAt: Date.now()
  });

  await remove(pendingRef);

  alert(`Denied ${data.email}`);
}


// =============================
//  MANUAL ADMIN-LEVEL USER CREATION
// =============================
document
  .getElementById("manual-create-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mName = document.getElementById("manual-name").value.trim();
    const mEmail = document.getElementById("manual-email").value.trim();
    const mPwd = document.getElementById("manual-password").value.trim();
    const mRole = document.getElementById("manual-role").value.trim();

    const k = mEmail.toLowerCase().replace(/\./g, ",");

    await set(ref(db, `users/${k}`), {
      name: mName,
      email: mEmail,
      password: mPwd,
      role: mRole,
      approved: true
    });

    document.getElementById("manual-message").textContent =
      "User created successfully!";
  });
