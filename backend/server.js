import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import scriptRoutes from "./routes/scriptRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve generated videos as static files
app.use("/outputs", express.static("outputs"));

// Routes
app.use("/api/script", scriptRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/video", videoRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ── Catch EADDRINUSE so nodemon doesn't get stuck in a crash loop ──────────
// Without this, the process throws an unhandled 'error' event and nodemon
// keeps retrying before the OS has released the port, looping forever.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Waiting for it to free...`);
    // Exit cleanly — nodemon will retry after its delay
    process.exit(1);
  } else {
    throw err;
  }
});

// ── Graceful shutdown for Nodemon restarts (SIGUSR2) ──────────────────────
process.once("SIGUSR2", () => {
  if (server.closeAllConnections) server.closeAllConnections();
  server.close(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});

// ── Graceful shutdown on Ctrl-C ────────────────────────────────────────────
process.on("SIGINT", () => {
  if (server.closeAllConnections) server.closeAllConnections();
  server.close(() => process.exit(0));
});
