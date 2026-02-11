const socket = io();

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const nameInput = document.getElementById("nameInput");
const codeInput = document.getElementById("codeInput");

const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const fileInput = document.getElementById("fileInput");

let username = "";

function tryLogin() {
  const name = nameInput.value.trim();
  const code = codeInput.value.trim();

  if (!name || !code) return;

  username = name;
  socket.emit("join", { name, code });
}

socket.on("accepted", () => {
  loginScreen.style.display = "none";
  chatScreen.style.display = "flex";
});

socket.on("denied", () => {
  alert("Неверный код!");
});

socket.on("history", (msgs) => {
  messagesDiv.innerHTML = "";
  msgs.forEach(addMessage);
});

socket.on("chat message", addMessage);

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

  const dateDiv = document.createElement("div");
  dateDiv.className = "date";
  dateDiv.textContent = date;

  const timeDiv = document.createElement("div");
  timeDiv.className = "time";
  timeDiv.textContent = time;

  div.appendChild(dateDiv);
  div.appendChild(name);

  if (msg.text) {
    const text = document.createElement("div");
    text.textContent = msg.text;
    div.appendChild(text);
  }

  if (msg.media) {
    if (msg.media_type && msg.media_type.startsWith("image")) {
      const img = document.createElement("img");
      img.src = msg.media;
      div.appendChild(img);
    } else if (msg.media_type) {
      const video = document.createElement("video");
      video.src = msg.media;
      video.controls = true;
      div.appendChild(video);
    }
  }

  div.appendChild(timeDiv);
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
