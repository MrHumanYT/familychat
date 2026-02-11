const socket = io();

let username = "";

const loginDiv = document.getElementById("loginDiv");
const chatDiv = document.getElementById("chatDiv");

const loginName = document.getElementById("loginName");
const loginCode = document.getElementById("loginCode");
const loginBtn = document.getElementById("loginBtn");

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const fileInput = document.getElementById("fileInput");

// ===== LOGIN =====

function tryLogin() {
  const name = loginName.value.trim();
  const code = loginCode.value.trim();

  if (!name || !code) return;

  loginBtn.textContent = "Подключение...";
  loginBtn.disabled = true;

  socket.emit("join", { name, code });
}

loginBtn.addEventListener("click", tryLogin);

socket.on("denied", () => {
  alert("Неверный код");
  loginBtn.textContent = "Войти";
  loginBtn.disabled = false;
});

socket.on("accepted", () => {
  username = loginName.value.trim();
  loginDiv.style.display = "none";
  chatDiv.style.display = "flex";
});

// ===== HISTORY =====

socket.on("history", (msgs) => {
  messagesDiv.innerHTML = "";
  msgs.forEach(m => addMessage(m));
});

socket.on("chat message", (msg) => {
  addMessage(msg);
});

// ===== RENDER MESSAGE =====

function formatDate(dateString) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return {
    date: `${day}.${month}.${year}`,
    time: `${hours}:${minutes}`
  };
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  const name = document.createElement("b");
  name.textContent = msg.user || msg.user_name;
  div.appendChild(name);

  if (msg.text) {
    const text = document.createElement("div");
    text.textContent = msg.text;
    div.appendChild(text);
  }

  if (msg.media) {
    if (msg.media_type?.startsWith("image") || msg.mediaType?.startsWith("image")) {
      const img = document.createElement("img");
      img.src = msg.media;
      div.appendChild(img);
    }

    if (msg.media_type?.startsWith("video") || msg.mediaType?.startsWith("video")) {
      const video = document.createElement("video");
      video.src = msg.media;
      video.controls = true;
      div.appendChild(video);
    }
  }

  const formatted = formatDate(msg.created_at);

  const dateDiv = document.createElement("div");
  dateDiv.style.fontSize = "12px";
  dateDiv.style.opacity = "0.6";
  dateDiv.textContent = formatted.date;

  const timeDiv = document.createElement("div");
  timeDiv.style.fontSize = "12px";
  timeDiv.style.opacity = "0.6";
  timeDiv.textContent = formatted.time;

  div.appendChild(dateDiv);
  div.appendChild(timeDiv);

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ===== SEND TEXT =====

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!input.value.trim()) return;

  socket.emit("chat message", {
    text: input.value.trim()
  });

  input.value = "";
});

// ===== SEND FILE =====

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    socket.emit("chat message", {
      media: reader.result,
      mediaType: file.type
    });
  };

  reader.readAsDataURL(file);
});
