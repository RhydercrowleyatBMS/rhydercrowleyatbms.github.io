// scripts/admin.js
import { db } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  remove,
  onValue,
  push
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const SCHOOL_DOMAIN = "@willisisd.org";

function emailToKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}

function isWillisEmail(email) {
  return email.trim().toLowerCase().endsWith(SCHOOL_DOMAIN);
}

const adminLocked = document.getElementById("admin-locked");
const adminContent = document.getElementById("admin-content");
const identityEl = document.getElementById("admin-identity");
const pendingListEl = document.getElementById("pending-list");

const manualForm = document.getElementById("manual-create-form");
const manualMsg = document.getElementById("manual-message");

// Check local role
const currentName = localStorage.getItem("flop_name");
const currentRole = localStorage.getItem("flop_role") || "user";

if (!currentName) {
  adminLocked.style.display = "block";
  adminLocked.querySelector(".index-note").textContent =
    "You are not logged in. Go to auth.html and log in first.";
} else if (!["mod", "owner"].includes(currentRole)) {
  adminLocked.style.display = "block";
} else {
  adminContent.style.display = "block";
  identityEl.textContent = `Logged in as ${currentName} [${currentRole.toUpperCase()}].`;
  initPendingAccounts();
}

// Load and render pending accounts
function initPendingAccounts() {
  const pendingRef = ref(db, "pendingAccounts");
  onValue(pendingRef, (snapshot) => {
    if (!snapshot.exists()) {
      pendingListEl.textContent = "No pending account requests.";
      return;
    }

    pendingListEl.innerHTML = "";
    snapshot.forEach(child => {
      const id = child.key;
      const data = child.val();
      const card = document.createElement("div");
      card.className = "panel";
      card.style.marginBottom = "8px";

      const header = document.createElement("div");
      header.className = "panel-header";

      const title = document.createElement("div");
      title.className = "panel-title";
      title.textContent = data.name || "(no name)";

      const meta = document.createElement("div");
      meta.className = "panel-meta";
      const when = data.createdAt ? new Date(data.createdAt).toLocaleString() : "unknown time";
      meta.textContent = `${data.email || "(no email)"} • requested ${when}`;

      header.appendChild(title);
      header.appendChild(meta);

      const body = document.createElement("div");
      body.className = "index-note";
      body.textContent = `Reason: ${data.reason || "(none)"}`;

      // Buttons
      const btnRow = document.createElement("div");
      btnRow.style.marginTop = "8px";
      btnRow.style.display = "flex";
      btnRow.style.gap = "8px";

      const approveBtn = document.createElement("button");
      approveBtn.type = "button";
      approveBtn.textContent = "Approve";

      const denyBtn = document.createElement("button");
      denyBtn.type = "button";
      denyBtn.textContent = "Deny";

      btnRow.appendChild(approveBtn);
      btnRow.appendChild(denyBtn);

      approveBtn.addEventListener("click", () => approvePending(id, data));
      denyBtn.addEventListener("click", () => denyPending(id, data));

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(btnRow);

      pendingListEl.appendChild(card);
    });
  });
}

// Approve: move to /users and remove from /pendingAccounts
async function approvePending(id, data) {
  if (!data || !data.email) return;

  const email = data.email.trim();
  if (!isWillisEmail(email)) {
    alert("Email is not a willisisd.org address. Fix in Firebase or deny.");
    return;
  }

  const userKey = emailToKey(email);
  const userRef = ref(db, `users/${userKey}`);

  await set(userRef, {
    name: data.name || "",
    email,
    password: data.password || "",
    role: "user",      // default role; you can edit role later
    approved: true,
    createdAt: data.createdAt || Date.now()
  });

  const pendingRef = ref(db, `pendingAccounts/${id}`);
  await remove(pendingRef);

  alert(`Approved account for ${data.name || email}. Remember to email them manually if you want.`);
}

// Deny: delete pending & optionally log a reason
async function denyPending(id, data) {
  const reason = prompt("Reason for denial (you will email them manually):", "");
  const pendingRef = ref(db, `pendingAccounts/${id}`);

  // Optional: log denials in a /deniedAccounts node
  if (reason && data && data.email) {
    const logRef = ref(db, "deniedAccounts");
    const newLog = push(logRef);
    await set(newLog, {
      name: data.name || "",
      email: data.email || "",
      reason,
      createdAt: Date.now(),
      reviewedBy: currentName
    });
  }

  await remove(pendingRef);
  alert("Request denied. Remember to email them if you want to explain why.");
}

// Manual account creation (owner only)
manualForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  manualMsg.textContent = "";

  if (currentRole !== "owner") {
    manualMsg.textContent = "Only the owner can create accounts manually.";
    return;
  }

  const name = document.getElementById("manual-name").value.trim();
  const email = document.getElementById("manual-email").value.trim();
  const password = document.getElementById("manual-password").value;
  const role = document.getElementById("manual-role").value;

  if (!name.includes(" ")) {
    manualMsg.textContent = "Please use a real name (first + last).";
    return;
  }

  if (!isWillisEmail(email)) {
    manualMsg.textContent = "Email must be a willisisd.org address.";
    return;
  }

  if (password.length < 4) {
    manualMsg.textContent = "Use a password with at least 4 characters.";
    return;
  }

  const userKey = emailToKey(email);
  const userRef = ref(db, `users/${userKey}`);
  const existing = await get(userRef);
  if (existing.exists()) {
    manualMsg.textContent = "That email already has an account.";
    return;
  }

  await set(userRef, {
    name,
    email,
    password,
    role,
    approved: true,
    createdAt: Date.now()
  });

  manualMsg.textContent = `Created account for ${name} as ${role}.`;
  manualForm.reset();
});
