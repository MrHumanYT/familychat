const socket = io();

let username = "";

// ===== ЭЛЕМЕНТЫ =====
const loginDiv = document.getElementById("loginDiv");
const chatDiv = document.getElementById("chatDiv");

const loginName = document.getElementById("loginName");
const loginCode = document.getElementById("loginCode");
const loginBtn = document.getElementById("loginBtn");

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");

// ================= LOGIN =================

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

// ================= ИСТОРИЯ =================

socket.on("history", (msgs) => {
  messagesDiv.innerHTML = "";
  msgs.forEach(msg => addMessage(msg));
});

socket.on("chat message", (msg) => {
  addMessage(msg);
});

// ================= ФОРМАТИРОВАНИЕ ДАТЫ/ВРЕМЕНИ (МОСКВА +3) =================

function formatDateTime(created_at) {
  const date = new Date(created_at);

  // прибавляем +3 часа напрямую
  date.setHours(date.getHours() + 3);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return { date: `${day}.${month}.${year}`, time: `${hour}:${minute}` };
}

// ================= ОТРИСОВКА СООБЩЕНИЯ =================

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  // Имя
  const name = document.createElement("b");
  name.textContent = msg.user_name || msg.user || "User";
  div.appendChild(name);

  // Текст
  if (msg.text) {
    const text = document.createElement("div");
    text.textContent = msg.text;
    div.appendChild(text);
  }

  // Медиа
  if (msg.media) {
    const mediaType = msg.media_type || msg.mediaType || "";

    if (mediaType.startsWith("image")) {
      const img = document.createElement("img");
      img.src = msg.media;
      div.appendChild(img);
    }

    if (mediaType.startsWith("video")) {
      const video = document.createElement("video");
      video.src = msg.media;
      video.controls = true;
      div.appendChild(video);
    }
  }

  // Дата и время
  const formatted = formatDateTime(msg.created_at || new Date());
  const timeBlock = document.createElement("small");
  timeBlock.textContent = `${formatted.date} ${formatted.time}`;
  div.appendChild(timeBlock);

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ================= ОТПРАВКА ТЕКСТА =================

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!input.value.trim()) return;

  socket.emit("chat message", {
    text: input.value.trim()
  });

  input.value = "";
});

// ================= КНОПКА ПРИКРЕПЛЕНИЯ =================

attachBtn.addEventListener("click", () => {
  fileInput.click();
});

// ================= ОТПРАВКА ФАЙЛА =================

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
  fileInput.value = "";
});
