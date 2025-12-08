// scripts/chat.js
import { db, ONE_DAY_MS } from "./firebaseConfig.js";
import {
  ref,
  get,
  push,
  set,
  onChildAdded,
  remove
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

const name = localStorage.getItem("flop_name");
const isAdmin = localStorage.getItem("flop_isAdmin") === "true";

const roomNameEl = document.getElementById("chat-room-name");
const roomMetaEl = document.getElementById("chat-room-meta");
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");
const adminBarEl = document.getElementById("admin-bar");
const clearBtn = document.getElementById("clear-messages-btn");
const deleteRoomBtn = document.getElementById("delete-room-btn");

if (!roomId) {
  window.location.href = "rooms.html";
}

if (!name) {
  window.location.href = "index.html";
}

let isDefaultRoom = false;

// Load room info
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
    isDefaultRoom = !!data.isDefault;

    roomNameEl.textContent = `room: ${data.name || roomId}`;
    roomMetaEl.textContent = data.isDefault
      ? "default room • does not auto-delete"
      : "custom room • auto-clears after 24 hours";

    if (isAdmin) {
      adminBarEl.style.display = "flex";
      if (isDefaultRoom) {
        deleteRoomBtn.disabled = true;
      }
    }
  } catch (err) {
    roomNameEl.textContent = "room: error loading";
    roomMetaEl.textContent = "something glitched.";
  }
})();

// Messages reference
const messagesRef = ref(db, `messages/${roomId}`);

// Clean up old messages (>24h)
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
    // ignore cleanup errors
  }
}

// Render a message DOM node
function renderMessage(key, data) {
  const wrap = document.createElement("div");
  wrap.className = "message";
  wrap.dataset.key = key;

  const header = document.createElement("div");
  header.className = "message-header";

  const left = document.createElement("div");
  const nameSpan = document.createElement("span");
  nameSpan.className = "message-name";
  if (data.isAdmin) {
    nameSpan.classList.add("message-name-admin");
  }
  nameSpan.textContent = data.name || "anon";

  left.appendChild(nameSpan);

  if (data.isAdmin) {
    const badge = document.createElement("span");
    badge.className = "message-admin-badge";
    badge.textContent = "ADMIN";
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

  if (isAdmin) {
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

// Listen for new messages
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

// Send a message
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  const newRef = push(messagesRef);
  await set(newRef, {
    name,
    text,
    createdAt: Date.now(),
    isAdmin
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

// Admin: clear all messages
clearBtn.addEventListener("click", async () => {
  if (!isAdmin) return;
  const ok = confirm("Clear all messages in this room?");
  if (!ok) return;
  await remove(messagesRef);
  messagesEl.innerHTML = "";
});

// Admin: delete room (only if custom)
deleteRoomBtn.addEventListener("click", async () => {
  if (!isAdmin) return;
  if (isDefaultRoom) return;
  const ok = confirm("Delete this room and all of its messages?");
  if (!ok) return;
  await remove(ref(db, `rooms/${roomId}`));
  await remove(messagesRef);
  window.location.href = "rooms.html";
});

// Initial cleanup
cleanupOldMessages();
