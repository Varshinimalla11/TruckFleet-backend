import express from "express";
//const owners = require("../routes/owners");
import auth from "../routes/auth.js";
import trucks from "../routes/trucks.js";
import trips from "../routes/trips.js";
import notifications from "../routes/notifications.js";
import inviteTokens from "../routes/inviteTokens.js";
import driveSessions from "../routes/driveSessions.js";
import restLogs from "../routes/restLogs.js";
import refuelEvents from "../routes/refuelEvents.js";
import dashboards from "../routes/dashboards.js";

export default function (app) {
  // Middleware to parse JSON bodies
  app.use(express.json());

  // Register the owners route
  //app.use("/api/owners", owners);
  app.use("/api/auth", auth);
  app.use("/api/trucks", trucks);
  app.use("/api/trips", trips);
  app.use("/api/notifications", notifications);
  app.use("/api/invitetokens", inviteTokens);
  app.use("/api/drive-sessions", driveSessions);
  app.use("/api/rest-logs", restLogs);
  app.use("/api/refuel-events", refuelEvents);
  app.use("/api/dashboard", dashboards);

  // Add other routes here as needed
};
