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

  // Initialize Socket.io natively without custom path constraints
  const io = new Server(httpServer, {
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
      if (!quizId || !userId) return;
      
      const room = `quiz-${quizId}`;
      socket.join(room);
      console.log(`🙋 Student ${userId} joined room ${room}`);

      // Broadcast to the host room that this student joined
      io.to(`${room}-host`).emit("student_joined", { userId });
    });

    // 2. Host joins the host room
    socket.on("join_host", ({ quizId }) => {
      if (!quizId) return;
      const hostRoom = `quiz-${quizId}-host`;
      
      socket.join(hostRoom);
      socket.join(`quiz-${quizId}`); // Host also listens to general room events
      
      console.log(`👑 Host joined room ${hostRoom}`);
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
