const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

// ==== НАСТРОЙКИ ====
const ACCESS_CODE = "2045";

const supabase = createClient(
  process.env.SUPABASE_URL, // Supabase URL
  process.env.SUPABASE_KEY  // Supabase anon key
);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

// ==== СТАТИЧЕСКИЕ ФАЙЛЫ ====
app.use(express.static("public"));

// ==== SOCKET.IO ====
io.on("connection", (socket) => {

  // ==== ПРИСОЕДИНЕНИЕ К ЧАТУ ====
  socket.on("join", async ({ name, code }) => {
    if (!name || code !== ACCESS_CODE) {
      socket.emit("denied");
      return;
    }

    socket.username = name;

    // Получаем историю сообщений из Supabase
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    socket.emit("history", data || []);
    socket.emit("accepted");
  });

  // ==== НОВОЕ СООБЩЕНИЕ ====
  socket.on("chat message", async (msg) => {
    if (!socket.username) return;

    // Создаём объект сообщения с текущим временем
    const messageData = {
      user_name: socket.username,
      text: msg.text || null,
      media: msg.media || null,
      media_type: msg.mediaType || null,
      created_at: new Date().toISOString()
    };

    // Вставляем в Supabase и возвращаем реальный объект
    const { data, error } = await supabase
      .from("messages")
      .insert([messageData])
      .select();

    if (!error && data) {
      io.emit("chat message", data[0]);
    }
  });

});

// ==== ЗАПУСК СЕРВЕРА ====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
