// scripts/rooms.js
import { db, ONE_DAY_MS } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  onValue,
  push,
  remove
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const roomListEl = document.getElementById("room-list");
const createForm = document.getElementById("create-room-form");
const roomNameInput = document.getElementById("room-name");
const identityEl = document.getElementById("identity");

const defaultRooms = [
  { id: "general", name: "general", isDefault: true },
  { id: "random", name: "random", isDefault: true }
];

const name = localStorage.getItem("flop_name");
const isAdmin = localStorage.getItem("flop_isAdmin") === "true";

if (!name) {
  window.location.href = "index.html";
}

identityEl.textContent = `Logged in as ${name}${isAdmin ? " [ADMIN]" : ""}.`;

// Ensure default rooms exist
async function ensureDefaultRooms() {
  for (const r of defaultRooms) {
    const roomRef = ref(db, `rooms/${r.id}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      await set(roomRef, {
        id: r.id,
        name: r.name,
        createdAt: Date.now(),
        isDefault: true
      });
    }
  }
}

// Clean up expired custom rooms (and their messages)
async function cleanupRoomsOnce(roomsSnapshot) {
  const now = Date.now();
  const updates = [];
  roomsSnapshot.forEach(child => {
    const val = child.val();
    if (!val) return;
    const { id, createdAt, isDefault } = val;
    if (!id) return;
    if (!isDefault && createdAt && now - createdAt > ONE_DAY_MS) {
      const roomRef = ref(db, `rooms/${id}`);
      const messagesRef = ref(db, `messages/${id}`);
      updates.push(remove(roomRef));
      updates.push(remove(messagesRef));
    }
  });
  if (updates.length) {
    await Promise.allSettled(updates);
  }
}

function renderRooms(roomsSnapshot) {
  roomListEl.innerHTML = "";
  const now = Date.now();
  const rooms = [];

  roomsSnapshot.forEach(child => {
    const val = child.val();
    if (!val) return;
    const { id, name, createdAt, isDefault } = val;
    if (!id || !name) return;

    if (!isDefault && createdAt && now - createdAt > ONE_DAY_MS) {
      return;
    }

    rooms.push(val);
  });

  rooms.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  if (rooms.length === 0) {
    const empty = document.createElement("div");
    empty.className = "index-note";
    empty.textContent = "No rooms yet. Spawn one below.";
    roomListEl.appendChild(empty);
    return;
  }

  for (const room of rooms) {
    const wrap = document.createElement("div");
    wrap.className = "room-card";

    const info = document.createElement("div");
    info.className = "room-info";

    const title = document.createElement("div");
    title.className = "room-name";
    title.textContent = room.name;

    const createdLine = document.createElement("div");
    createdLine.className = "room-meta-line";

    const ageText = room.createdAt
      ? `created ${(new Date(room.createdAt)).toLocaleString()}`
      : "created (unknown time)";

    const typeText = room.isDefault ? "default room" : "custom 24h room";
    createdLine.textContent = `${typeText} • ${ageText}`;

    info.appendChild(title);
    info.appendChild(createdLine);

    const tag = document.createElement("div");
    tag.className = room.isDefault ? "room-tag-default" : "room-tag-custom";
    tag.textContent = room.isDefault ? "core" : "temp";

    wrap.appendChild(info);
    wrap.appendChild(tag);

    wrap.addEventListener("click", () => {
      window.location.href = `chat.html?room=${encodeURIComponent(room.id)}`;
    });

    roomListEl.appendChild(wrap);
  }
}

// Create custom room
createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const raw = roomNameInput.value.trim();
  if (!raw) return;

  const cleanName = raw.replace(/[.#$\[\]]/g, "").toLowerCase();
  if (!cleanName) return;

  const roomsRef = ref(db, "rooms");
  const newRef = push(roomsRef);
  const roomId = newRef.key;

  await set(newRef, {
    id: roomId,
    name: raw,
    createdAt: Date.now(),
    isDefault: false
  });

  roomNameInput.value = "";
  window.location.href = `chat.html?room=${encodeURIComponent(roomId)}`;
});

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
