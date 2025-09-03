import winston from "winston";
import logger from "../startup/logging.js";

export default function (err, req, res, next) {
  logger.error(err.message, err);

  res.status(500).send("Something failed.");
}
// This middleware logs the error using Winston and sends a 500 response to the client
// It is used to handle errors that occur during request processing
