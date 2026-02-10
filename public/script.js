const socket = io();
const messagesDiv = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const fileInput = document.getElementById("fileInput");

const loginDiv = document.getElementById("loginDiv");
const chatDiv = document.getElementById("chatDiv");
const loginName = document.getElementById("loginName");
const loginCode = document.getElementById("loginCode");
const loginBtn = document.getElementById("loginBtn");

let username = "";

// Отображение сообщения
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  const nameSpan = document.createElement("b");
  nameSpan.textContent = msg.user + ": ";
  div.appendChild(nameSpan);

  if (msg.text) {
    const textSpan = document.createElement("span");
    textSpan.textContent = msg.text;
    div.appendChild(textSpan);
  }

  if (msg.media) {
    if (msg.mediaType.startsWith("image")) {
      const img = document.createElement("img");
      img.src = msg.media;
      div.appendChild(img);
    } else if (msg.mediaType.startsWith("video")) {
      const video = document.createElement("video");
      video.src = msg.media;
      video.controls = true;
      div.appendChild(video);
    }
  }

  const timeSpan = document.createElement("span");
  timeSpan.textContent = " " + msg.time;
  timeSpan.style.fontSize = "0.8em";
  div.appendChild(timeSpan);

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Логин через кнопку
loginBtn.addEventListener("click", () => {
  const name = loginName.value.trim();
  const code = loginCode.value.trim();
  if (!name || !code) return;

  socket.emit("join", { name, code });
});

socket.on("denied", () => {
  alert("Неверный код или имя");
});

socket.on("accepted", () => {
  username = loginName.value.trim();
  loginDiv.style.display = "none";
  chatDiv.style.display = "flex";
});

socket.on("history", (msgs) => {
  messagesDiv.innerHTML = "";
  msgs.forEach(m => addMessage({
    user: m.user_name,
    text: m.text,
    media: m.media,
    mediaType: m.media_type,
    time: new Date(m.created_at).toLocaleTimeString("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit"
    })
  }));
});

socket.on("chat message", (msg) => addMessage(msg));

// Отправка текста
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", { text: input.value });
    input.value = "";
  }
});

// Отправка файла
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
