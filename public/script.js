const socket = io();

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const nameInput = document.getElementById("nameInput");
const codeInput = document.getElementById("codeInput");
const colorSelect = document.getElementById("colorSelect");

const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const fileInput = document.getElementById("fileInput");

let username = "";
let userColor = "#007aff";

window.onload = () => {
  const savedName = localStorage.getItem("chatName");
  const savedColor = localStorage.getItem("chatColor");

  if (savedName) nameInput.value = savedName;
  if (savedColor) colorSelect.value = savedColor;
};

function tryLogin() {
  const name = nameInput.value.trim();
  const code = codeInput.value.trim();

  if (!name || !code) return;

  username = name;
  userColor = colorSelect.value;

  socket.emit("join", { name, code, color: userColor });
}

socket.on("accepted", () => {
  loginScreen.style.display = "none";
  chatScreen.style.display = "flex";

  localStorage.setItem("chatName", username);
  localStorage.setItem("chatColor", userColor);

  requestNotificationPermission();
});

socket.on("denied", () => {
  alert("Неверный код!");
});

socket.on("history", (msgs) => {
  messagesDiv.innerHTML = "";
  msgs.forEach(addMessage);
});

socket.on("chat message", (msg) => {
  addMessage(msg);

  if (msg.user_name !== username && document.hidden) {
    if (Notification.permission === "granted") {
      new Notification(msg.user_name, {
        body: msg.text || "📎 Медиа"
      });
    }
  }
});

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  const dateObj = new Date(msg.created_at);

  const date = dateObj.toLocaleDateString("ru-RU");
  const time = dateObj.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const name = document.createElement("b");
  name.textContent = msg.user_name;
  name.style.color = msg.user_color;

  const dateSpan = document.createElement("div");
  dateSpan.className = "date";
  dateSpan.textContent = date;

  const timeSpan = document.createElement("div");
  timeSpan.className = "time";
  timeSpan.textContent = time;

  div.appendChild(dateSpan);
  div.appendChild(name);

  if (msg.text) {
    const text = document.createElement("div");
    text.textContent = msg.text;
    div.appendChild(text);
  }

  if (msg.media) {
    if (msg.media_type.startsWith("image")) {
      const img = document.createElement("img");
      img.src = msg.media;
      div.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.src = msg.media;
      video.controls = true;
      div.appendChild(video);
    }
  }

  div.appendChild(timeSpan);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.getElementById("sendBtn").onclick = sendMessage;

function sendMessage() {
  const text = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!text && !file) return;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("chat message", {
        text,
        media: reader.result,
        mediaType: file.type
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit("chat message", { text });
  }

  messageInput.value = "";
  fileInput.value = "";
}

function requestNotificationPermission() {
  if ("Notification" in window) {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }
}
