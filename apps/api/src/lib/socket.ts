import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/crypto";

export function createSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.API_CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next();
      return;
    }

    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("live:join", ({ sessionId, role }) => {
      socket.join(`live:${sessionId}`);
      socket.to(`live:${sessionId}`).emit("live:presence", {
        socketId: socket.id,
        role,
      });
    });

    socket.on("live:sync", ({ sessionId, payload }) => {
      socket.to(`live:${sessionId}`).emit("live:update", payload);
    });

    socket.on("disconnect", () => {
      socket.broadcast.emit("live:presence:disconnect", {
        socketId: socket.id,
      });
    });
  });

  return io;
}

