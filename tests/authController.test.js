// // __tests__/authController.test.js

// const authController = require("../../../TFM_Backend/controllers/authController");
// const { User } = require("../../../TFM_Backend/models/user");
// const { InviteToken } = require("../../../TFM_Backend/models/inviteToken");
// const {
//   validateUser,
// } = require("../../../TFM_Backend/validationModels/validateUser");
// const {
//   validatePasswordReset,
// } = require("../../../TFM_Backend/validationModels/validatePasswordReset");
// const bcrypt = require("bcrypt");
// const _ = require("lodash");
// const { notifyUser } = require("../../../TFM_Backend/utils/notifyUser");
// const {
//   sendPasswordResetEmail,
// } = require("../../../TFM_Backend/utils/emailService");

// // Mock all external modules
// jest.mock("../models/user");
// jest.mock("../models/inviteToken");
// jest.mock("../validationModels/validateUser");
// jest.mock("bcrypt");
// jest.mock("lodash");
// jest.mock("../validationModels/validatePasswordReset", () => ({
//   validateEmail: jest.fn(),
//   validatePasswordReset: jest.fn(),
// }));
// jest.mock("../utils/emailService", () => ({
//   sendPasswordResetEmail: jest.fn(),
// }));
// jest.mock("../utils/notifyUser", () => jest.fn());
// jest.mock("../models/emailVerification");
// jest.mock("config", () => ({
//   get: jest.fn((key) => {
//     if (key === "env") return "test";
//     if (key === "jwtPrivateKey") return "testkey";
//     return undefined;
//   }),
// }));

// describe("authController", () => {
//   let req, res, statusMock, sendMock;

//   beforeEach(() => {
//     sendMock = jest.fn();
//     statusMock = jest.fn(() => res); // chain .status().send()
//     res = { status: statusMock, send: sendMock };
//     jest.clearAllMocks();
//   });

//   describe("register", () => {
//     beforeEach(() => {
//       req = {
//         body: {
//           name: "John",
//           email: "test@example.com",
//           phone: "1234567890",
//           password: "password123",
//         },
//       };
//     });

//     test("returns 400 if validation fails", async () => {
//       validateUser.mockReturnValue({
//         error: { details: [{ message: "Invalid input" }] },
//       });
//       await authController.register(req, res);
//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(sendMock).toHaveBeenCalledWith({ message: "Invalid input" });
//     });

//     test("returns 409 if email already registered", async () => {
//       validateUser.mockReturnValue({});
//       User.findOne.mockImplementation(async (query) => {
//         if (query.email === req.body.email) return {};
//         return null;
//       });
//       // EmailVerification should be found for registration, but this test is for email already registered
//       await authController.register(req, res);
//       expect(statusMock).toHaveBeenCalledWith(409);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: "Email is already registered",
//       });
//     });

//     test("returns 409 if phone already registered", async () => {
//       validateUser.mockReturnValue({});
//       User.findOne
//         .mockResolvedValueOnce(null) // for email check
//         .mockResolvedValueOnce({ phone: req.body.phone }); // for phone check
//       // EmailVerification should be found for registration, but this test is for phone already registered
//       await authController.register(req, res);
//       expect(statusMock).toHaveBeenCalledWith(409);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: "Phone number is already registered",
//       });
//     });

//     test("returns 403 if email not verified", async () => {
//       validateUser.mockReturnValue({});
//       User.findOne.mockResolvedValue(null);
//       const {
//         EmailVerification,
//       } = require("../../../TFM_Backend/models/emailVerification");
//       EmailVerification.findOne = jest.fn().mockResolvedValue(null);
//       await authController.register(req, res);
//       expect(statusMock).toHaveBeenCalledWith(403);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: expect.stringContaining("verify your email"),
//       });
//     });

//     test("successful registration returns token", async () => {
//       validateUser.mockReturnValue({});
//       User.findOne.mockResolvedValue(null);
//       const {
//         EmailVerification,
//       } = require("../../../TFM_Backend/models/emailVerification");
//       EmailVerification.findOne = jest
//         .fn()
//         .mockResolvedValue({ verified: true, expiresAt: Date.now() + 10000 });
//       _.pick.mockReturnValue({
//         name: req.body.name,
//         email: req.body.email,
//         phone: req.body.phone,
//         password: req.body.password,
//       });
//       const saveMock = jest.fn().mockResolvedValue(true);
//       const generateAuthTokenMock = jest.fn(() => "fake.jwt.token");
//       User.mockImplementation(() => ({
//         save: saveMock,
//         generateAuthToken: generateAuthTokenMock,
//       }));
//       await authController.register(req, res);
//       expect(saveMock).toHaveBeenCalled();
//       expect(generateAuthTokenMock).toHaveBeenCalled();
//       expect(sendMock).toHaveBeenCalledWith({ token: "fake.jwt.token" });
//     });

//     test("successful registration without phone does not check phone uniqueness", async () => {
//       req.body.phone = undefined;
//       validateUser.mockReturnValue({});
//       User.findOne.mockResolvedValue(null);
//       const {
//         EmailVerification,
//       } = require("../../../TFM_Backend/models/emailVerification");
//       EmailVerification.findOne = jest
//         .fn()
//         .mockResolvedValue({ verified: true, expiresAt: Date.now() + 10000 });
//       _.pick.mockReturnValue({
//         name: req.body.name,
//         email: req.body.email,
//         password: req.body.password,
//       });
//       const saveMock = jest.fn();
//       const generateAuthTokenMock = jest.fn(() => "fake.jwt.token");
//       User.mockImplementation(() => ({
//         save: saveMock,
//         generateAuthToken: generateAuthTokenMock,
//       }));
//       await authController.register(req, res);
//       expect(User.findOne).toHaveBeenCalledTimes(1); // only email check
//       expect(saveMock).toHaveBeenCalled();
//       expect(sendMock).toHaveBeenCalledWith({ token: "fake.jwt.token" });
//     });
//     test("returns 403 if owner email not verified", async () => {
//       User.findOne.mockResolvedValue({
//         password: "hashedPassword",
//         _id: "userid123",
//         name: "John",
//         email: "test@example.com",
//         role: "owner",
//         emailVerified: false,
//         generateAuthToken: () => "jwt.token",
//       });
//       await authController.login(req, res);
//       expect(statusMock).toHaveBeenCalledWith(403);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: expect.stringContaining("Email not verified"),
//       });
//     });
//   });

//   describe("login", () => {
//     beforeEach(() => {
//       req = {
//         body: {
//           email: "test@example.com",
//           password: "password123",
//         },
//       };
//     });

//     test("returns 400 if user not found", async () => {
//       User.findOne.mockResolvedValue(null);

//       await authController.login(req, res);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(sendMock).toHaveBeenCalledWith("Invalid email or password.");
//     });

//     test("returns 400 if invalid password", async () => {
//       User.findOne.mockResolvedValue({
//         password: "hashedPassword",
//         generateAuthToken: () => "token",
//       });
//       bcrypt.compare.mockResolvedValue(false);

//       await authController.login(req, res);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(sendMock).toHaveBeenCalledWith("Invalid email or password.");
//     });

//     test("returns token and user data on successful login", async () => {
//       const userObj = {
//         password: "hashedPassword",
//         _id: "userid123",
//         name: "John",
//         email: "test@example.com",
//         role: "owner",
//         emailVerified: true,
//         generateAuthToken: () => "jwt.token",
//       };
//       User.findOne.mockResolvedValue(userObj);
//       bcrypt.compare.mockResolvedValue(true);
//       _.pick.mockReturnValue({
//         _id: userObj._id,
//         name: userObj.name,
//         email: userObj.email,
//         role: userObj.role,
//       });

//       await authController.login(req, res);

//       expect(sendMock).toHaveBeenCalledWith({
//         token: "jwt.token",
//         user: {
//           _id: userObj._id,
//           name: userObj.name,
//           email: userObj.email,
//           role: userObj.role,
//         },
//       });
//     });
//   });

//   describe("getCurrentUser", () => {
//     beforeEach(() => {
//       req = {
//         user: {
//           _id: "userid123",
//         },
//       };
//     });

//     test("returns 404 if user not found", async () => {
//       User.findById = jest.fn(() => ({
//         select: jest.fn().mockResolvedValue(null),
//       }));

//       await authController.getCurrentUser(req, res);

//       expect(statusMock).toHaveBeenCalledWith(404);
//       expect(sendMock).toHaveBeenCalledWith("User not found.");
//     });

//     test("returns user data without password", async () => {
//       const userData = {
//         _id: "userid123",
//         name: "John",
//         email: "test@example.com",
//       };
//       User.findById = jest.fn(() => ({
//         select: jest.fn().mockResolvedValue(userData),
//       }));

//       await authController.getCurrentUser(req, res);

//       expect(sendMock).toHaveBeenCalledWith(userData);
//     });
//   });

//   describe("registerDriver", () => {
//     beforeEach(() => {
//       req = {
//         body: {
//           token: "validtoken",
//           name: "Driver User",
//           email: "driver@example.com",
//           phone: "1234567890",
//           password: "driverpass",
//           aadhar_number: "123456789012",
//           license_number: "DL123456",
//         },
//       };
//     });

//     test("returns 400 if token missing", async () => {
//       req.body.token = undefined;

//       await authController.registerDriver(req, res);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: "Invite token is required",
//       });
//     });

//     test("returns 400 for invalid or expired invite token", async () => {
//       InviteToken.findOne.mockResolvedValue(null);

//       await authController.registerDriver(req, res);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: "Invalid or expired invite token",
//       });
//     });

//     test("returns 400 if email does not match invite", async () => {
//       InviteToken.findOne.mockResolvedValue({
//         email: "otheremail@example.com",
//         isUsed: false,
//         expiresAt: Date.now() + 10000,
//       });

//       await authController.registerDriver(req, res);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: "Email does not match the invite",
//       });
//     });

//     test("returns 400 if user already registered", async () => {
//       InviteToken.findOne.mockResolvedValue({
//         email: req.body.email.toLowerCase(),
//         isUsed: false,
//         expiresAt: Date.now() + 10000,
//       });
//       User.findOne.mockResolvedValue({ email: req.body.email });

//       await authController.registerDriver(req, res);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(sendMock).toHaveBeenCalledWith({
//         message: "User already registered",
//       });
//     });

//     test("successful driver registration returns token and user info", async () => {
//       InviteToken.findOne.mockResolvedValue({
//         token: req.body.token,
//         email: req.body.email.toLowerCase(),
//         isUsed: false,
//         expiresAt: Date.now() + 10000,
//         owner: "owner123",
//         save: jest.fn(),
//       });

//       User.findOne.mockResolvedValue(null);

//       _.pick.mockImplementation((obj, fields) => {
//         return fields.reduce((res, f) => {
//           if (f === "role") {
//             res[f] = "driver";
//           } else {
//             res[f] = obj[f];
//           }
//           return res;
//         }, {});
//       });

//       const saveMock = jest.fn();
//       const generateAuthTokenMock = jest.fn(() => "driver.jwt.token");

//       User.mockImplementation(() => ({
//         save: saveMock,
//         generateAuthToken: generateAuthTokenMock,
//         _id: "userid123",
//         name: req.body.name,
//         email: req.body.email,
//         role: "driver",
//       }));

//       await authController.registerDriver(req, res);

//       expect(saveMock).toHaveBeenCalled();
//       expect(generateAuthTokenMock).toHaveBeenCalled();

//       expect(sendMock).toHaveBeenCalledWith({
//         token: "driver.jwt.token",
//         user: expect.objectContaining({
//           _id: "userid123",
//           email: req.body.email,
//           name: req.body.name,
//           role: "driver",
//         }),
//       });
//     });

//     test("handles exceptions and returns 500", async () => {
//       InviteToken.findOne.mockImplementation(() => {
//         throw new Error("DB error");
//       });

//       await authController.registerDriver(req, res);

//       expect(statusMock).toHaveBeenCalledWith(500);
//       expect(sendMock).toHaveBeenCalledWith({ message: "Server error" });
//     });
//   });

//   describe("getAllDrivers", () => {
//     beforeEach(() => {
//       sendMock = jest.fn();
//       statusMock = jest.fn(() => res);
//       res = { status: statusMock, send: sendMock };
//     });

//     test("returns drivers for owner", async () => {
//       req = {
//         user: { role: "owner", _id: "owner123" },
//       };

//       User.find = jest.fn(() => ({
//         select: jest
//           .fn()
//           .mockResolvedValue([{ name: "Driver A" }, { name: "Driver B" }]),
//       }));

//       await authController.getAllDrivers(req, res);

//       expect(sendMock).toHaveBeenCalledWith([
//         { name: "Driver A" },
//         { name: "Driver B" },
//       ]);
//     });

//     test("returns all drivers for admin", async () => {
//       req = {
//         user: { role: "admin" },
//       };

//       User.find = jest.fn(() => ({
//         select: jest
//           .fn()
//           .mockResolvedValue([
//             { name: "Driver A" },
//             { name: "Driver B" },
//             { name: "Driver C" },
//           ]),
//       }));

//       await authController.getAllDrivers(req, res);

//       expect(sendMock).toHaveBeenCalledWith([
//         { name: "Driver A" },
//         { name: "Driver B" },
//         { name: "Driver C" },
//       ]);
//     });

//     test("returns 403 if driver tries access", async () => {
//       req = {
//         user: { role: "driver" },
//       };

//       await authController.getAllDrivers(req, res);

//       expect(statusMock).toHaveBeenCalledWith(403);
//       expect(sendMock).toHaveBeenCalledWith({ message: "Access denied" });
//     });

//     test("handles error with 500", async () => {
//       req = { user: { role: "owner", _id: "owner123" } };

//       User.find = jest.fn(() => ({
//         select: jest.fn(() => {
//           throw new Error("DB fail");
//         }),
//       }));

//       await authController.getAllDrivers(req, res);

//       expect(statusMock).toHaveBeenCalledWith(500);
//       expect(sendMock).toHaveBeenCalledWith({ message: "Server error" });
//     });
//   });

//   describe("forgotPassword", () => {
//     let validateEmail, sendPasswordResetEmail, notifyUser;
//     beforeEach(() => {
//       validateEmail =
//         require("../../../TFM_Backend/validationModels/validatePasswordReset").validateEmail;
//       sendPasswordResetEmail =
//         require("../../../TFM_Backend/utils/emailService").sendPasswordResetEmail;
//       notifyUser = require("../../../TFM_Backend/utils/notifyUser");
//       req = { body: { email: "test@example.com" } };
//       res = { status: jest.fn(() => res), send: jest.fn() };
//       jest.clearAllMocks();
//     });

//     test("returns 400 if email validation fails", async () => {
//       validateEmail.mockReturnValue({
//         error: { details: [{ message: "Invalid email" }] },
//       });
//       await authController.forgotPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.send).toHaveBeenCalledWith({ message: "Invalid email" });
//     });

//     test("returns 200 if user not found", async () => {
//       validateEmail.mockReturnValue({});
//       User.findOne.mockResolvedValue(null);
//       await authController.forgotPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.send).toHaveBeenCalledWith({
//         message: expect.stringContaining("password reset link has been sent"),
//       });
//     });

//     test("returns 200 if email send fails", async () => {
//       validateEmail.mockReturnValue({});
//       User.findOne.mockResolvedValue({
//         email: "test@example.com",
//         save: jest.fn(),
//       });
//       sendPasswordResetEmail.mockRejectedValue(new Error("fail"));
//       notifyUser.mockResolvedValue();
//       await authController.forgotPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.send).toHaveBeenCalledWith({
//         message: expect.stringContaining("password reset link has been sent"),
//       });
//     });

//     test("returns 200 if email sent", async () => {
//       validateEmail.mockReturnValue({});
//       User.findOne.mockResolvedValue({
//         email: "test@example.com",
//         save: jest.fn(),
//       });
//       sendPasswordResetEmail.mockResolvedValue();
//       notifyUser.mockResolvedValue();
//       await authController.forgotPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.send).toHaveBeenCalledWith({
//         message: expect.stringContaining("password reset link has been sent"),
//       });
//     });

//     test("returns 500 on error", async () => {
//       validateEmail.mockReturnValue({});
//       User.findOne.mockImplementation(() => {
//         throw new Error("fail");
//       });
//       await authController.forgotPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.send).toHaveBeenCalledWith({ message: "Server error" });
//     });
//   });

//   describe("resetPassword", () => {
//     let validatePasswordReset, notifyUser;
//     beforeEach(() => {
//       validatePasswordReset =
//         require("../../../TFM_Backend/validationModels/validatePasswordReset").validatePasswordReset;
//       notifyUser = require("../../../TFM_Backend/utils/notifyUser");
//       req = { body: { token: "token", newPassword: "newpass" } };
//       res = { status: jest.fn(() => res), send: jest.fn() };
//       jest.clearAllMocks();
//     });

//     test("returns 400 if validation fails", async () => {
//       validatePasswordReset.mockReturnValue({
//         error: { details: [{ message: "Invalid" }] },
//       });
//       await authController.resetPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.send).toHaveBeenCalledWith({ message: "Invalid" });
//     });

//     test("returns 400 if token invalid or expired", async () => {
//       validatePasswordReset.mockReturnValue({});
//       User.findOne.mockResolvedValue(null);
//       await authController.resetPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.send).toHaveBeenCalledWith({
//         message: "Invalid or expired reset token",
//       });
//     });

//     test("returns 400 if new password is same as old", async () => {
//       validatePasswordReset.mockReturnValue({});
//       User.findOne.mockResolvedValue({ password: "oldpass" });
//       require("bcrypt").compare.mockResolvedValue(true);
//       await authController.resetPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.send).toHaveBeenCalledWith({
//         message: expect.stringContaining("cannot be the same"),
//       });
//     });

//     test("resets password and notifies user", async () => {
//       validatePasswordReset.mockReturnValue({});
//       User.findOne.mockResolvedValue({ password: "oldpass", save: jest.fn() });
//       require("bcrypt").compare.mockResolvedValue(false);
//       notifyUser.mockResolvedValue();
//       await authController.resetPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.send).toHaveBeenCalledWith({
//         message: "Password reset successfully",
//       });
//     });

//     test("returns 500 on error", async () => {
//       validatePasswordReset.mockReturnValue({});
//       User.findOne.mockImplementation(() => {
//         throw new Error("fail");
//       });
//       await authController.resetPassword(req, res);
//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.send).toHaveBeenCalledWith({ message: "Server error" });
//     });
//   });

//   describe("validateResetToken", () => {
//     beforeEach(() => {
//       req = { params: { token: "token" } };
//       res = { status: jest.fn(() => res), send: jest.fn() };
//       jest.clearAllMocks();
//     });

//     test("returns 400 if token invalid or expired", async () => {
//       User.findOne.mockResolvedValue(null);
//       await authController.validateResetToken(req, res);
//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.send).toHaveBeenCalledWith({
//         valid: false,
//         message: expect.stringContaining("Invalid or expired"),
//       });
//     });

//     test("returns 200 if token valid", async () => {
//       User.findOne.mockResolvedValue({});
//       await authController.validateResetToken(req, res);
//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.send).toHaveBeenCalledWith({
//         valid: true,
//         message: "Token is valid",
//       });
//     });

//     test("returns 500 on error", async () => {
//       User.findOne.mockImplementation(() => {
//         throw new Error("fail");
//       });
//       await authController.validateResetToken(req, res);
//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.send).toHaveBeenCalledWith({ message: "Server error" });
//     });
//   });
// });
