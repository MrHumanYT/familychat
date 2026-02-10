const socket = io();
let username = "";

const login = document.getElementById("login");
const chat = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");

document.getElementById("joinBtn").onclick = () => {
  username = document.getElementById("name").value.trim();
  const code = document.getElementById("code").value.trim();
  socket.emit("join", { name: username, code });
};

socket.on("accepted", () => {
  login.classList.add("hidden");
  chat.classList.remove("hidden");
});

socket.on("denied", () => alert("Неверный код или имя"));

socket.on("history", msgs => {
  messagesDiv.innerHTML = "";
  msgs.forEach(addMessage);
});

document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault();

  const text = document.getElementById("input").value;
  const fileInput = document.getElementById("file");
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

  document.getElementById("input").value = "";
  fileInput.value = "";
});

socket.on("chat message", addMessage);

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  let media = "";
  if (msg.media) {
    if (msg.mediaType.startsWith("video")) {
      media = `<video controls src="${msg.media}"></video>`;
    } else {
      media = `<img src="${msg.media}">`;
    }
  }

  div.innerHTML = `
    <div class="name">${msg.user} <small>${msg.time}</small></div>
    <div>${msg.text || ""}</div>
    ${media}
  `;

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}