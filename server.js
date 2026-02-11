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
  process.env.SUPABASE_SERVICE_KEY
);

app.use(express.static("public"));

io.on("connection", (socket) => {

  socket.on("join", async ({ name, code }) => {
    if (code !== ACCESS_CODE || !name) {
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

    const messageData = {
      user_name: socket.username,
      text: msg.text || null,
      media: msg.media || null,
      media_type: msg.mediaType || null,
      created_at: new Date().toISOString()
    };

    await supabase.from("messages").insert([messageData]);

    io.emit("chat message", messageData);
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
