const express = require("express");
//const owners = require("../routes/owners");
const auth = require("../routes/auth");
const trucks = require("../routes/trucks");
const trips = require("../routes/trips");
const notifications = require("../routes/notifications");
const inviteTokens = require("../routes/inviteTokens");

module.exports = function (app) {
  // Middleware to parse JSON bodies
  app.use(express.json());

  // Register the owners route
  //app.use("/api/owners", owners);
  app.use("/api/auth", auth);
  app.use("/api/trucks", trucks);
  app.use("/api/trips", trips);
  app.use("/api/notifications", notifications);
  app.use("/api/invitetokens", inviteTokens);

  // Add other routes here as needed
};
