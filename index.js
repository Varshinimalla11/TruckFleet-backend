const express = require("express");
const winston = require("winston");
const app = express();

require("./startup/config")();
require("./startup/validation")();
require("./startup/db")();
require("./startup/routes")(app);

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
const server = app.listen(port, () => {
  winston.info(`Server is running on port ${port}`);
});

module.exports = server;
