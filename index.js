const express = require("express");
const winston = require("winston");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerOptions = require("./swagger/swaggerOptions");
const cors = require("cors");
const { initSocket } = require("./utils/socketUtils");
const app = express();

app.use(cors());

require("./startup/config")();
require("./startup/validation")();
require("./startup/db")();
require("./cron/driveMonitoringJob");
require("./startup/routes")(app);

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  winston.info(`Server is running on port ${port}`);
});

initSocket(server);

module.exports = server;
