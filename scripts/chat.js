// scripts/chat.js
import { db, ONE_DAY_MS } from "./firebaseConfig.js";
import {
  ref,
  get,
  push,
  set,
  onChildAdded,
  onChildRemoved,
  remove
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

const name = localStorage.getItem("flop_name");
const role = localStorage.getItem("flop_role") || "user";

const isOwner = role === "owner";
const isMod = role === "mod" || isOwner;
const isTrial = role === "trial";
const canAdmin = isOwner || isMod || isTrial;

const roomNameEl = document.getElementById("chat-room-name");
const roomMetaEl = document.getElementById("chat-room-meta");
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");
const adminBarEl = document.getElementById("admin-bar");
const clearBtn = document.getElementById("clear-messages-btn");

if (!roomId) {
  window.location.href = "rooms.html";
}

if (!name) {
  window.location.href = "auth.html";
}

if (canAdmin) {
  adminBarEl.style.display = "flex";
}

// load room info
(async function loadRoom() {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      roomNameEl.textContent = "room: deleted / unknown";
      roomMetaEl.textContent = "this room no longer exists.";
      sendBtn.disabled = true;
      inputEl.disabled = true;
      return;
    }
    const data = snap.val();

    roomNameEl.textContent = `room: ${data.name || roomId}`;
    roomMetaEl.textContent = data.isDefault
      ? "default room • does not auto-delete"
      : "custom room • auto-clears after 24 hours";
  } catch (err) {
    roomNameEl.textContent = "room: error loading";
    roomMetaEl.textContent = "something glitched.";
  }
})();

const messagesRef = ref(db, `messages/${roomId}`);

async function cleanupOldMessages() {
  try {
    const snap = await get(messagesRef);
    if (!snap.exists()) return;
    const now = Date.now();
    const removals = [];
    snap.forEach(child => {
      const val = child.val();
      if (!val) return;
      const { createdAt } = val;
      if (createdAt && now - createdAt > ONE_DAY_MS) {
        removals.push(remove(child.ref));
      }
    });
    if (removals.length) {
      await Promise.allSettled(removals);
    }
  } catch (err) {
    // ignore
  }
}

function isMessageAllowed(rawText, isOwnerBypass = false) {
  const text = rawText.toLowerCase();
  if (isOwnerBypass && isOwner) return true;

  const bannedWords = [
    "N_SLUR_GOES_HERE",
    "F_SLUR_GOES_HERE",
    "R_SLUR_GOES_HERE"
    // add more variants if you want
  ];

  for (const bad of bannedWords) {
    if (!bad) continue;
    if (text.includes(bad.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function renderMessage(key, data) {
  const wrap = document.createElement("div");
  wrap.className = "message";
  wrap.dataset.key = key;

  const header = document.createElement("div");
  header.className = "message-header";

  const left = document.createElement("div");
  const nameSpan = document.createElement("span");
  nameSpan.className = "message-name";
  if (data.role === "owner" || data.role === "mod" || data.isAdmin) {
    nameSpan.classList.add("message-name-admin");
  }
  nameSpan.textContent = data.name || "anon";

  left.appendChild(nameSpan);

  if (data.role === "owner" || data.role === "mod") {
    const badge = document.createElement("span");
    badge.className = "message-admin-badge";
    badge.textContent = data.role.toUpperCase();
    left.appendChild(badge);
  }

  const right = document.createElement("div");
  right.className = "message-time";
  if (data.createdAt) {
    const d = new Date(data.createdAt);
    right.textContent = d.toLocaleTimeString();
  } else {
    right.textContent = "time unknown";
  }

  header.appendChild(left);
  header.appendChild(right);

  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = data.text || "";

  wrap.appendChild(header);
  wrap.appendChild(body);

  const isOwnMessage = (data.name === name);
  if (isOwnMessage || canAdmin) {
    const delBtn = document.createElement("button");
    delBtn.className = "message-delete";
    delBtn.type = "button";
    delBtn.textContent = "x";
    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await remove(ref(db, `messages/${roomId}/${key}`));
    });
    wrap.appendChild(delBtn);
  }

  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

onChildAdded(messagesRef, (snapshot) => {
  const key = snapshot.key;
  const val = snapshot.val();
  if (!val) return;

  const now = Date.now();
  if (val.createdAt && now - val.createdAt > ONE_DAY_MS) {
    remove(snapshot.ref);
    return;
  }

  renderMessage(key, val);
});

onChildRemoved(messagesRef, (snapshot) => {
  const key = snapshot.key;
  const node = messagesEl.querySelector(`[data-key="${key}"]`);
  if (node) node.remove();
});

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  if (!isMessageAllowed(text, false)) {
    alert("That message contains blocked language and cannot be sent.");
    return;
  }

  const newRef = push(messagesRef);
  await set(newRef, {
    name,
    text,
    createdAt: Date.now(),
    role
  });

  inputEl.value = "";
}

sendBtn.addEventListener("click", sendMessage);

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

clearBtn.addEventListener("click", async () => {
  if (!isOwner) {
    alert("Only the owner can clear all messages.");
    return;
  }
  const ok = confirm("Clear all messages in this room?");
  if (!ok) return;
  await remove(messagesRef);
  messagesEl.innerHTML = "";
});

cleanupOldMessages();
