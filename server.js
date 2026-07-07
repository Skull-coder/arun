import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.io natively with the correct path
  const io = new Server(httpServer, {
    path: "/api/socket/io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // MAGIC STEP: Expose `io` globally!
  // This allows any Next.js API route to call `global.io.emit(...)`
  global.io = io;

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // 1. Student joins a quiz room
    socket.on("join_quiz", ({ quizId, userId }) => {
      if (!quizId) return;
      
      const room = `quiz-${quizId}`;
      socket.join(room);
      if (userId) {
        socket.join(`user-${userId}-quiz-${quizId}`);
      }
      
      console.log(`🙋 Student joined room ${room} ${userId ? `(User: ${userId})` : ''}`);

      // Broadcast updated live count to everyone in the room (including host)
      const count = io.sockets.adapter.rooms.get(room)?.size || 0;
      io.to(room).emit("live_count_updated", { count });
    });

    // 2. Host joins the host room
    socket.on("join_host", ({ quizId }) => {
      if (!quizId) return;
      const hostRoom = `quiz-${quizId}-host`;
      
      socket.join(hostRoom);
      const room = `quiz-${quizId}`;
      socket.join(room); // Host also listens to general room events
      
      console.log(`👑 Host joined room ${hostRoom}`);
      
      // Update host with current count
      const count = io.sockets.adapter.rooms.get(room)?.size || 0;
      socket.emit("live_count_updated", { count });
    });

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room.startsWith("quiz-") && !room.endsWith("-host")) {
          // Socket is leaving, so actual count will be size - 1
          const currentSize = io.sockets.adapter.rooms.get(room)?.size || 1;
          io.to(room).emit("live_count_updated", { count: currentSize - 1 });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> 🚀 Socket.io + Next.js Server ready on http://${hostname}:${port}`);
    });
});
