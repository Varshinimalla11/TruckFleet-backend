// // tests/controllers/driveSessionController.test.js
// const DriveSession = require("../models/driveSession");
// const RestLog = require("../models/restLog");
// const Trip = require("../models/trip");
// const RefuelEvent = require("../models/refuelEvent");
// const { Truck } = require("../models/truck");
// const { Notification } = require("../models/notification");
// const notifyUser = require("../utils/notifyUser");
// const driveSessionController = require("../controllers/driveSessionController");

// // Mock all dependencies
// jest.mock("../models/driveSession");
// jest.mock("../models/restLog");
// jest.mock("../models/trip");
// jest.mock("../models/refuelEvent");
// jest.mock("../models/truck");
// jest.mock("../models/notification");
// jest.mock("../utils/notifyUser");

// describe("DriveSessionController", () => {
//   let req, res;

//   beforeEach(() => {
//     req = {
//       body: {},
//       params: {},
//       user: {
//         _id: "driver123",
//         role: "driver",
//       },
//     };

//     res = {
//       status: jest.fn().mockReturnThis(),
//       send: jest.fn(),
//       json: jest.fn(),
//     };

//     jest.clearAllMocks();
//   });

//   describe("endDriveSessionAndStartRest", () => {
//     it("should return 404 if drive session not found", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 50;

//       DriveSession.findById.mockResolvedValue(null);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(res.status).toHaveBeenCalledWith(404);
//       expect(res.send).toHaveBeenCalledWith("Drive session not found");
//     });

//     it("should return 400 if session already ended", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 50;

//       const mockSession = {
//         _id: "session123",
//         end_time: new Date(),
//         save: jest.fn(),
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.send).toHaveBeenCalledWith("Session already ended");
//     });

//     it("should end session and start rest successfully with trip start fuel", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 50;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 500,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: 5,
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(null);
//       DriveSession.findOne.mockResolvedValue(null);
//       RefuelEvent.find.mockResolvedValue([]);
//       DriveSession.aggregate.mockResolvedValue([]);
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.save).toHaveBeenCalled();
//       expect(mockRestLog.save).toHaveBeenCalled();
//       expect(notifyUser).toHaveBeenCalledTimes(2);
//       expect(res.send).toHaveBeenCalledWith(
//         expect.objectContaining({
//           message: "Drive session ended and rest started",
//         })
//       );
//       expect(mockSession.fuel_used).toBe(50); // 100 - 50 = 50
//       expect(mockSession.km_covered).toBe(250); // 50 * 5 = 250
//     });

//     it("should use fuel from last rest log if available", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 40;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 500,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: 5,
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockLastRestLog = {
//         fuel_at_rest_end: 80,
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(mockLastRestLog);
//       DriveSession.findOne.mockResolvedValue(null);
//       RefuelEvent.find.mockResolvedValue([]);
//       DriveSession.aggregate.mockResolvedValue([]);
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.fuel_used).toBe(40); // 80 - 40 = 40
//       expect(mockSession.km_covered).toBe(200); // 40 * 5 = 200
//     });

//     it("should use fuel from last drive session if available", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 40;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 500,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: 5,
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockLastDrive = {
//         fuel_left: 70,
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(null);
//       DriveSession.findOne.mockResolvedValue(mockLastDrive);
//       RefuelEvent.find.mockResolvedValue([]);
//       DriveSession.aggregate.mockResolvedValue([]);
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.fuel_used).toBe(30); // 70 - 40 = 30
//       expect(mockSession.km_covered).toBe(150); // 30 * 5 = 150
//     });

//     it("should handle refuel events during drive session", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 60;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 500,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: 5,
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockRefuelEvents = [{ fuel_added: 20 }, { fuel_added: 10 }];

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(null);
//       DriveSession.findOne.mockResolvedValue(null);
//       RefuelEvent.find.mockResolvedValue(mockRefuelEvents);
//       DriveSession.aggregate.mockResolvedValue([]);
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.fuel_used).toBe(70); // 100 + 30 - 60 = 70
//       expect(mockSession.km_covered).toBe(350); // 70 * 5 = 350
//     });

//     it("should handle case where km_covered exceeds total trip km", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 30;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 100,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: 5,
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(null);
//       DriveSession.findOne.mockResolvedValue(null);
//       RefuelEvent.find.mockResolvedValue([]);
//       DriveSession.aggregate.mockResolvedValue([{ total: 80 }]);
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.km_covered).toBe(20); // Capped at 100 - 80 = 20
//     });

//     it("should handle negative fuel usage gracefully", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 110;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 500,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: 5,
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(null);
//       DriveSession.findOne.mockResolvedValue(null);
//       RefuelEvent.find.mockResolvedValue([]);
//       DriveSession.aggregate.mockResolvedValue([]);
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.fuel_used).toBe(0); // Capped at 0
//       expect(mockSession.km_covered).toBe(0); // Capped at 0
//     });

//     it("should handle default mileage factor when truck has none", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 50;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 500,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: null, // No mileage factor
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(null);
//       DriveSession.findOne.mockResolvedValue(null);
//       RefuelEvent.find.mockResolvedValue([]);
//       DriveSession.aggregate.mockResolvedValue([]);
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.km_covered).toBe(150); // 50 * 3 (default mileage) = 150
//     });

//     it("should handle database errors gracefully", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 50;

//       DriveSession.findById.mockRejectedValue(new Error("Database error"));

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.send).toHaveBeenCalledWith({
//         message: "Internal Server Error",
//       });
//     });

//     it("should handle empty aggregate result for previous km", async () => {
//       req.params.session_id = "session123";
//       req.body.fuel_left = 50;
//       req.user._id = "driver123";

//       const mockSession = {
//         _id: "session123",
//         trip_id: "trip123",
//         start_time: new Date("2023-01-01T09:00:00Z"),
//         end_time: null,
//         fuel_used: null,
//         km_covered: null,
//         fuel_left: null,
//         duration_hours: null,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockTrip = {
//         _id: "trip123",
//         truck_id: "truck123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//         total_km: 500,
//         fuel_start: 100,
//         driver_snapshot: { name: "Test Driver" },
//       };

//       const mockTruck = {
//         _id: "truck123",
//         mileage_factor: 5,
//       };

//       const mockRestLog = {
//         _id: "rest123",
//         save: jest.fn().mockResolvedValue(true),
//       };

//       DriveSession.findById.mockResolvedValue(mockSession);
//       Trip.findById.mockResolvedValue(mockTrip);
//       Truck.findById.mockResolvedValue(mockTruck);
//       RestLog.findOne.mockResolvedValue(null);
//       DriveSession.findOne.mockResolvedValue(null);
//       RefuelEvent.find.mockResolvedValue([]);
//       DriveSession.aggregate.mockResolvedValue([]); // Empty array
//       RestLog.mockImplementation(() => mockRestLog);

//       await driveSessionController.endDriveSessionAndStartRest(req, res);

//       expect(mockSession.km_covered).toBe(250); // Should calculate normally
//     });
//   });

//   describe("getSessionsByTrip", () => {
//     it("should return 404 if trip not found", async () => {
//       req.params.tripId = "trip123";

//       Trip.findById.mockResolvedValue(null);

//       await driveSessionController.getSessionsByTrip(req, res);

//       expect(res.status).toHaveBeenCalledWith(404);
//       expect(res.send).toHaveBeenCalledWith("Trip not found");
//     });

//     it("should return 403 if driver tries to access another driver's trip", async () => {
//       req.params.tripId = "trip123";
//       req.user._id = "driver123";
//       req.user.role = "driver";

//       const mockTrip = {
//         _id: "trip123",
//         driver_id: "differentDriver123",
//       };

//       Trip.findById.mockResolvedValue(mockTrip);

//       await driveSessionController.getSessionsByTrip(req, res);

//       expect(res.status).toHaveBeenCalledWith(403);
//       expect(res.send).toHaveBeenCalledWith("Access denied");
//     });

//     it("should return sessions for authorized driver", async () => {
//       req.params.tripId = "trip123";
//       req.user._id = "driver123";
//       req.user.role = "driver";

//       const mockTrip = {
//         _id: "trip123",
//         driver_id: "driver123",
//       };

//       const mockSessions = [
//         { _id: "session1", trip_id: "trip123" },
//         { _id: "session2", trip_id: "trip123" },
//       ];

//       Trip.findById.mockResolvedValue(mockTrip);
//       DriveSession.find.mockResolvedValue(mockSessions);

//       await driveSessionController.getSessionsByTrip(req, res);

//       expect(DriveSession.find).toHaveBeenCalledWith({ trip_id: "trip123" });
//       expect(res.send).toHaveBeenCalledWith(mockSessions);
//     });

//     it("should allow owner to access any trip sessions", async () => {
//       req.params.tripId = "trip123";
//       req.user._id = "owner123";
//       req.user.role = "owner";

//       const mockTrip = {
//         _id: "trip123",
//         driver_id: "driver123",
//         owner_id: "owner123",
//       };

//       const mockSessions = [
//         { _id: "session1", trip_id: "trip123" },
//         { _id: "session2", trip_id: "trip123" },
//       ];

//       Trip.findById.mockResolvedValue(mockTrip);
//       DriveSession.find.mockResolvedValue(mockSessions);

//       await driveSessionController.getSessionsByTrip(req, res);

//       expect(DriveSession.find).toHaveBeenCalledWith({ trip_id: "trip123" });
//       expect(res.send).toHaveBeenCalledWith(mockSessions);
//     });

//     it("should handle database errors gracefully", async () => {
//       req.params.tripId = "trip123";
//       req.user._id = "driver123";
//       req.user.role = "driver";

//       const mockTrip = {
//         _id: "trip123",
//         driver_id: "driver123",
//       };

//       Trip.findById.mockResolvedValue(mockTrip);
//       DriveSession.find.mockRejectedValue(new Error("Database error"));

//       await driveSessionController.getSessionsByTrip(req, res);

//       expect(res.status).toHaveBeenCalledWith(500);
//     });
//   });

//   describe("Utility Functions", () => {
//     it("getMinutesBetween should calculate minutes correctly", () => {
//       const start = new Date("2023-01-01T09:00:00Z");
//       const end = new Date("2023-01-01T10:30:00Z");

//       const result = driveSessionController.getMinutesBetween(start, end);

//       expect(result).toBe(90); // 1.5 hours = 90 minutes
//     });

//     it("sendViolationNotification should call notifyUser", async () => {
//       await driveSessionController.sendViolationNotification(
//         "user123",
//         "Test message"
//       );

//       expect(notifyUser).toHaveBeenCalledWith("user123", "Test message", {
//         type: "warning",
//       });
//     });
//   });
// });
