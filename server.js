const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const webpush = require("web-push");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

const ACCESS_CODE = "2045";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// === ВСТАВЬ СВОИ КЛЮЧИ ===
webpush.setVapidDetails(
  "mailto:test@test.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

let subscriptions = [];

app.post("/subscribe", (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({});
});

io.on("connection", (socket) => {

  socket.on("join", async ({ name, code, color }) => {
    if (code !== ACCESS_CODE || !name) {
      socket.emit("denied");
      return;
    }

    socket.username = name;
    socket.userColor = color || "#007aff";

    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    socket.emit("history", data || []);
    socket.emit("accepted");
  });

  socket.on("chat message", async (msg) => {
    if (!socket.username) return;

    const messageData = {
      user_name: socket.username,
      user_color: socket.userColor,
      text: msg.text || null,
      media: msg.media || null,
      media_type: msg.mediaType || null,
      created_at: new Date().toISOString()
    };

    await supabase.from("messages").insert([messageData]);

    io.emit("chat message", messageData);

    // PUSH ВСЕМ
    const payload = JSON.stringify({
      title: messageData.user_name,
      body: messageData.text || "📎 Медиа"
    });

    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload)
        .catch(() => {});
    });
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
