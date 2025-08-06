const winston = require("winston");

module.exports = function (err, req, res, next) {
  winston.error(err.message, err);

  res.status(500).send("Something failed.");
};
// This middleware logs the error using Winston and sends a 500 response to the client
// It is used to handle errors that occur during request processing
