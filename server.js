const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

const ACCESS_CODE = "2045";
const messagesPath = path.join(__dirname, "messages.json");

app.use(express.static("public"));

let messages = [];
if (fs.existsSync(messagesPath)) {
  messages = JSON.parse(fs.readFileSync(messagesPath));
}

io.on("connection", (socket) => {
  socket.on("join", ({ name, code }) => {
    if (code !== ACCESS_CODE || !name) {
      socket.emit("denied");
      return;
    }
    socket.username = name;
    socket.emit("history", messages);
    socket.emit("accepted");
  });

  socket.on("chat message", (msg) => {
    if (!socket.username) return;

    const fullMsg = {
      user: socket.username,
      text: msg.text || "",
      media: msg.media || null,
      mediaType: msg.mediaType || null,
      time: new Date().toLocaleTimeString("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit" })
    };

    messages.push(fullMsg);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
    io.emit("chat message", fullMsg);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
