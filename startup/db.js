import winston from "winston";
import mongoose from "mongoose";
import config from "config";

export default function () {
  const db = config.get("db");
  mongoose
    .connect(db)
    .then(() => winston.info(`Connected to ${db}...`))
    .catch((err) => winston.error(`Could not connect to ${db}:`, err));
};
