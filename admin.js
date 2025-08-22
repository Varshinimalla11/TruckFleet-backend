import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import config from "config";

import { User } from "./models/user.js";
import { Truck } from "./models/truck.js";
import Trip from "./models/trip.js";
import RefuelEvent from "./models/refuelEvent.js";
import RestLog from "./models/restLog.js";
import DriveSession from "./models/driveSession.js";
import { Notification } from "./models/notification.js";
import { InviteToken } from "./models/inviteToken.js";

AdminJS.registerAdapter(AdminJSMongoose.default || AdminJSMongoose);

const adminJs = new AdminJS({
  resources: [
    User,
    Truck,
    Trip,
    RefuelEvent,
    RestLog,
    DriveSession,
    Notification,
    InviteToken,
  ],
  rootPath: "/admin",
  branding: {
    companyName: "TFM Admin Panel",
  },
});

const adminConfig = config.get("admin") || {};
const ADMIN = {
  email: adminConfig.email || "admin@example.com",
  password: adminConfig.password || "adminpassword",
};

// 🔹 Auth options
const authOptions = {
  authenticate: async (email, password) => {
    if (email === ADMIN.email && password === ADMIN.password) {
      return ADMIN;
    }
    return null;
  },
  cookiePassword: "Asdfghjkl0987654321",
};

// 🔹 Session options (needed in new versions)
const sessionOptions = {
  resave: false,
  saveUninitialized: true,
  secret: "Asdfghjkl0987654321",
};

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  authOptions,
  null,
  sessionOptions
);

export default adminRouter;
