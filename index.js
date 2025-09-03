import checkConfig from "./startup/config.js";
checkConfig();
import express from "express";
import winston from "winston";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerOptions from "./swagger/swaggerOptions.js";
import cors from "cors";
import connectDB from "./startup/db.js";
import { initSocket } from "./utils/socketUtils.js";
import adminRouter from "./admin.js";
import logger from "./startup/logging.js";

const app = express();

app.use(cors());

import("./startup/validation.js");

await connectDB();

import("./cron/driveMonitoringJob.js");
const startupRoutesModule = await import("./startup/routes.js");
startupRoutesModule.default(app);

app.use("/admin", adminRouter);

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

initSocket(server);

export default server;
