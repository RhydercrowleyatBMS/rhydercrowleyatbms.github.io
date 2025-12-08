// ======================
//  rooms.js (new, fixed)
// ======================

import { db, ONE_DAY_MS } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  onValue,
  push,
  remove
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";


// ======================
//  LOGIN / USER STATE
// ======================

async function waitForLocalStorage() {
  let tries = 0;
  while (tries < 10) {
    const name = localStorage.getItem("flop_name");
    if (name) return name;
    await new Promise(r => setTimeout(r, 30));
    tries++;
  }
  return null;
}

const identityEl = document.getElementById("identity");

// MAIN LOGIN CHECK
(async function verifyLogin() {
  const name = await waitForLocalStorage();
  const role = localStorage.getItem("flop_role") || "user";

  if (!name) {
    console.warn("No name in LS → redirecting");
    window.location.href = "auth.html";
    return;
  }

  // Update UI
  if (identityEl) identityEl.textContent = `${name} (${role})`;
})();


// ======================
//  ELEMENTS
// ======================

const roomListEl = document.getElementById("room-list");
const createForm = document.getElementById("create-room-form");
const roomNameInput = document.getElementById("room-name");
const backHomeBtn = document.getElementById("back-home-btn");


// ======================
//  DEFAULT ROOMS
// ======================

async function ensureDefaultRooms() {
  const roomsRef = ref(db, "rooms");
  const snap = await get(roomsRef);

  if (!snap.exists()) {
    await set(roomsRef, {
      general: {
        id: "general",
        name: "General Chat",
        createdAt: Date.now()
      },
      helpdesk: {
        id: "helpdesk",
        name: "Help Desk",
        createdAt: Date.now()
      }
    });
  }
}


// ======================
//  CLEANUP OLD ROOMS
// ======================

async function cleanupRoomsOnce(snapshot) {
  const now = Date.now();

  snapshot.forEach(async child => {
    const room = child.val();
    if (!room || !room.createdAt) return;

    if (now - room.createdAt > ONE_DAY_MS * 7) { // 7 days old
      await remove(ref(db, `rooms/${room.id}`));
      await remove(ref(db, `messages/${room.id}`));
    }
  });
}


// ======================
//  RENDERING UI
// ======================

function renderRooms(snapshot) {
  roomListEl.innerHTML = "";

  snapshot.forEach(child => {
    const room = child.val();
    if (!room) return;

    const div = document.createElement("div");
    div.className = "room-item";
    div.textContent = room.name;
    div.addEventListener("click", () => {
      window.location.href = `chat.html?room=${room.id}`;
    });

    roomListEl.appendChild(div);
  });
}


// ======================
//  CREATE ROOM
// ======================

createForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = roomNameInput.value.trim();
  if (!name) return;

  const roomId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  await set(ref(db, `rooms/${roomId}`), {
    id: roomId,
    name,
    createdAt: Date.now()
  });

  roomNameInput.value = "";
});


// ======================
//  HOME BUTTON
// ======================

backHomeBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});


// ======================
//  INITIALIZATION
// ======================

(async function init() {
  await ensureDefaultRooms();

  const roomsRef = ref(db, "rooms");
  onValue(roomsRef, async (snapshot) => {
    if (!snapshot.exists()) {
      roomListEl.innerHTML = "";
      return;
    }
    await cleanupRoomsOnce(snapshot);
    renderRooms(snapshot);
  });
})();
