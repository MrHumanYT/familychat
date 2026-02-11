const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

let supabase = null;

try {
  const { createClient } = require("@supabase/supabase-js");

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    console.log("Supabase connected");
  } else {
    console.log("Supabase ENV not found");
  }
} catch (err) {
  console.log("Supabase module not installed");
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

const ACCESS_CODE = "2045";

app.use(express.static("public"));

io.on("connection", (socket) => {

  socket.on("join", async ({ name, code }) => {
    if (code !== ACCESS_CODE || !name) {
      socket.emit("denied");
      return;
    }

    socket.username = name;

    if (supabase) {
      try {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: true });

        socket.emit("history", data || []);
      } catch (err) {
        console.log("History load error:", err.message);
        socket.emit("history", []);
      }
    } else {
      socket.emit("history", []);
    }

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

    if (supabase) {
      try {
        await supabase.from("messages").insert([messageData]);
      } catch (err) {
        console.log("Insert error:", err.message);
      }
    }

    io.emit("chat message", messageData);
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
