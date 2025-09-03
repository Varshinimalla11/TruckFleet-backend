// utils/socketUtils.js
import config from "config";
import { Notification } from "../models/notification.js";
import winston from "winston";
import logger from "../startup/logging.js";
import { Server } from "socket.io";

let io;

function initSocket(server) {
  const socketConfig = config.get("socket");

  io = new Server(server, {
    path: socketConfig.path,
    cors: {
      origin: socketConfig.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    socket.on("join-user-room", (userId) => {
      socket.join(`user-${userId}`);
      logger.info(`User ${userId} joined their notification room`);
    });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

async function emitNotification(userId, notification) {
  const io = getIO();
  io.to(`user-${userId}`).emit("new-notification", notification);
  logger.info(`Sent real-time notification to user ${userId}`);
}

export { initSocket, getIO, emitNotification };
