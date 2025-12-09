import { messagesRef, sendMessage, clearMessages, onChildAdded } from "./firebase.js";

const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const nameInput = document.getElementById("chat-name");
const messageInput = document.getElementById("chat-message");
const adminCodeInput = document.getElementById("admin-code");
const clearChatBtn = document.getElementById("clear-chat-btn");

const ADMIN_CODE = "flopqueen"; // change this to whatever you want
const DAY_MS = 24 * 60 * 60 * 1000;

function createAnonName() {
  const saved = localStorage.getItem("cr_anon_name");
  if (saved) return saved;
  const id = Math.floor(Math.random() * 9000) + 1000;
  const anon = "anon" + id;
  localStorage.setItem("cr_anon_name", anon);
  return anon;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMessage(key, data) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-message";
  wrapper.dataset.key = key;

  const header = document.createElement("div");
  header.className = "chat-header-line";

  const nameEl = document.createElement("span");
  nameEl.className = "chat-name";
  nameEl.textContent = data.name || "anon";

  const timeEl = document.createElement("span");
  timeEl.className = "chat-time";
  timeEl.textContent = formatTime(data.createdAt);

  header.appendChild(nameEl);
  header.appendChild(timeEl);

  const textEl = document.createElement("p");
  textEl.className = "chat-text";
  textEl.textContent = data.text || "";

  wrapper.appendChild(header);
  wrapper.appendChild(textEl);

  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// listen for new messages
onChildAdded(messagesRef, (snapshot) => {
  const data = snapshot.val();
  const key = snapshot.key;
  if (!data || !data.createdAt) return;

  const age = Date.now() - data.createdAt;
  if (age > DAY_MS) {
    // too old, auto-delete & don't render
    remove(snapshot.ref);
    return;
  }

  renderMessage(key, data);
});

// send message handler
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rawName = nameInput.value.trim();
  const name = rawName || createAnonName();
  const text = messageInput.value.trim();
  if (!text) return;

  const msg = {
    name,
    text,
    createdAt: Date.now()
  };

  try {
    await sendMessage(msg);
    messageInput.value = "";
  } catch (err) {
    console.error("failed to send message", err);
  }
});

// admin clear
clearChatBtn.addEventListener("click", async () => {
  const code = adminCodeInput.value.trim();
  if (!code) return alert("enter admin code");
  if (code !== ADMIN_CODE) return alert("wrong admin code");

  if (!confirm("clear all messages? this cannot be undone.")) return;

  try {
    await clearMessages();
    chatWindow.innerHTML = "";
  } catch (err) {
    console.error("failed to clear messages", err);
  }
});
