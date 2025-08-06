const express = require("express");
//const owners = require("../routes/owners");
const auth = require("../routes/auth");
const trucks = require("../routes/trucks");

module.exports = function (app) {
  // Middleware to parse JSON bodies
  app.use(express.json());

  // Register the owners route
  //app.use("/api/owners", owners);
  app.use("/api/auth", auth);
  app.use("/api/trucks", trucks);

  // Add other routes here as needed
};
