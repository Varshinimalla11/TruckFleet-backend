import winston from "winston";
import mongoose from "mongoose";
import config from "config";
import logger from "./logging.js";

export default function () {
  const db = config.get("db");
  mongoose
    .connect(db)
    .then(() => logger.info(`Connected to ${db}...`))
    .catch((err) => logger.error(`Could not connect to ${db}:`, err));
}
