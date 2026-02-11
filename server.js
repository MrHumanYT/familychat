const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

const ACCESS_CODE = "2045";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(express.static("public"));

io.on("connection", (socket) => {

  socket.on("join", async ({ name, code }) => {
    if (!name || code !== ACCESS_CODE) {
      socket.emit("denied");
      return;
    }

    socket.username = name;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    socket.emit("history", data || []);
    socket.emit("accepted");
  });

  socket.on("chat message", async (msg) => {
    if (!socket.username) return;

    const message = {
      user_name: socket.username,
      text: msg.text || "",
      media: msg.media || null,
      media_type: msg.mediaType || null
    };

    await supabase.from("messages").insert([message]);

    io.emit("chat message", {
      user: message.user_name,
      text: message.text,
      media: message.media,
      mediaType: message.media_type,
      time: new Date().toLocaleTimeString("ru-RU", {
        timeZone: "Europe/Moscow",
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
