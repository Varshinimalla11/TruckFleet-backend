// const AdminJS = require("adminjs");
// const AdminJSExpress = require("@adminjs/express").then((m) => m.default);
// const AdminJSMongoose = require("@adminjs/mongoose");
// const config = require("config");

// const { User } = require("./models/user");
// const { Truck } = require("./models/truck");
// const Trip = require("./models/trip");
// const RefuelEvent = require("./models/refuelEvent");
// const RestLog = require("./models/restLog");
// const DriveSession = require("./models/driveSession");
// const { Notification } = require("./models/notification");
// const { InviteToken } = require("./models/inviteToken");

// AdminJS.registerAdapter(AdminJSMongoose);

// const adminJs = new AdminJS({
//   resources: [
//     User,
//     Truck,
//     Trip,
//     RefuelEvent,
//     RestLog,
//     DriveSession,
//     Notification,
//     InviteToken,
//   ],
//   rootPath: "/admin",
//   branding: {
//     companyName: "TFM Admin Panel",
//   },
// });

// const adminConfig = config.get("admin") || {};
// const ADMIN = {
//   email: adminConfig.email || "admin@example.com",
//   password: adminConfig.password || "adminpassword",
// };

// // 🔹 Auth options
// const authOptions = {
//   authenticate: async (email, password) => {
//     if (email === ADMIN.email && password === ADMIN.password) {
//       return ADMIN;
//     }
//     return null;
//   },
//   cookiePassword: "Asdfghjkl0987654321",
// };

// // 🔹 Session options (needed in new versions)
// const sessionOptions = {
//   resave: false,
//   saveUninitialized: true,
//   secret: "Asdfghjkl0987654321",
// };

// const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
//   adminJs,
//   authOptions,
//   null,
//   sessionOptions
// );

// module.exports = adminRouter;
