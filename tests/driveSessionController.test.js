// tests/driveSessionController.test.js
import { jest } from "@jest/globals";
import { get } from "config";

// Mock config
jest.mock("config", () => ({
  get: (key) => {
    if (key === "jwtSecret" || key === "jwtPrivateKey")
      return "test_jwt_secret";
    if (key === "email.user") return "test@example.com";
    if (key === "email.pass") return "testpass";
    if (key === "socket.corsOrigin") return "http://localhost";
    if (key === "socket.path") return "/socket.io";
    return null;
  },
}));

// Mock models and utilities
jest.mock("../models/driveSession");
jest.mock("../models/restLog");
jest.mock("../models/trip");
jest.mock("../models/refuelEvent");
jest.mock("../models/truck");
jest.mock("../utils/notifyUser");

// Import the mocked modules
import DriveSession from "../models/driveSession";
import RestLog from "../models/restLog";
import Trip from "../models/trip";
import RefuelEvent from "../models/refuelEvent";
import { Truck } from "../models/truck";
import notifyUser from "../utils/notifyUser";

// Import the controller
import driveSessionController from "../controllers/driveSessionController";

describe("DriveSessionController", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: "driver123", role: "driver" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("endDriveSessionAndStartRest", () => {
    it("should return 404 if drive session not found", async () => {
      req.params.session_id = "sess1";
      req.body.fuel_left = 50;

      DriveSession.findById.mockResolvedValue(null);

      await driveSessionController.endDriveSessionAndStartRest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Drive session not found");
    });

    it("should return 400 if session already ended", async () => {
      req.params.session_id = "sess1";
      req.body.fuel_left = 50;

      const mockSession = {
        _id: "sess1",
        end_time: new Date(),
        save: jest.fn(),
      };

      DriveSession.findById.mockResolvedValue(mockSession);

      await driveSessionController.endDriveSessionAndStartRest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Session already ended");
    });

    it("should end session and start rest successfully", async () => {
      req.params.session_id = "sess1";
      req.body.fuel_left = 50;

      const mockSessionSave = jest.fn().mockResolvedValue(true);
      const mockRestLogSave = jest.fn().mockResolvedValue(true);

      const mockSession = {
        _id: "sess1",
        trip_id: "trip1",
        start_time: new Date(Date.now() - 3600000),
        end_time: null,
        save: mockSessionSave,
      };
      Object.setPrototypeOf(mockSession, DriveSession.prototype);
      DriveSession.findById.mockResolvedValue(mockSession);

      const mockTrip = {
        _id: "trip1",
        truck_id: "truck1",
        driver_id: "driver123",
        owner_id: "owner1",
        total_km: 1000,
        fuel_start: 100,
        driver_snapshot: { name: "Driver Name" },
      };

      const mockTruck = {
        _id: "truck1",
        mileage_factor: 5,
      };

      RestLog.mockImplementation(() => ({ save: mockRestLogSave }));
      Trip.findById.mockResolvedValue(mockTrip);
      Truck.findById.mockResolvedValue(mockTruck);
      RestLog.findOne.mockResolvedValue(null);
      DriveSession.findOne.mockResolvedValue(null);
      RefuelEvent.find.mockResolvedValue([]);
      DriveSession.aggregate.mockResolvedValue([]);

      notifyUser.mockResolvedValue();

      await driveSessionController.endDriveSessionAndStartRest(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("getSessionsByTrip", () => {
    it("should return 404 if trip not found", async () => {
      req.params.tripId = "trip1";
      Trip.findById.mockResolvedValue(null);

      await driveSessionController.getSessionsByTrip(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Trip not found");
    });

    it("should return 403 if driver unauthorized", async () => {
      req.params.tripId = "trip1";
      req.user._id = "driver123";
      req.user.role = "driver";

      const mockTrip = { _id: "trip1", driver_id: "otherDriver" };
      Trip.findById.mockResolvedValue(mockTrip);

      await driveSessionController.getSessionsByTrip(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith("Access denied");
    });

    it("should return sessions for authorized driver", async () => {
      req.params.tripId = "trip1";
      req.user._id = "driver123";
      req.user.role = "driver";

      const mockTrip = { _id: "trip1", driver_id: "driver123" };
      const mockSessions = [{ _id: "sess1" }, { _id: "sess2" }];

      Trip.findById.mockResolvedValue(mockTrip);
      DriveSession.find.mockResolvedValue(mockSessions);

      await driveSessionController.getSessionsByTrip(req, res);

      expect(DriveSession.find).toHaveBeenCalledWith({ trip_id: "trip1" });
      expect(res.send).toHaveBeenCalledWith(mockSessions);
    });

    it("should allow owner to access any trip sessions", async () => {
      req.params.tripId = "trip1";
      req.user._id = "owner1";
      req.user.role = "owner";

      const mockTrip = {
        _id: "trip1",
        driver_id: "driver123",
        owner_id: "owner1",
      };
      const mockSessions = [{ _id: "sess1" }, { _id: "sess2" }];

      Trip.findById.mockResolvedValue(mockTrip);
      DriveSession.find.mockResolvedValue(mockSessions);

      await driveSessionController.getSessionsByTrip(req, res);

      expect(DriveSession.find).toHaveBeenCalledWith({ trip_id: "trip1" });
      expect(res.send).toHaveBeenCalledWith(mockSessions);
    });
  });
});

describe("driveSessionController full coverage", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: "driverId", role: "driver" } };
    res = { status: jest.fn(() => res), send: jest.fn() };
    jest.clearAllMocks();
  });

  describe("endDriveSessionAndStartRest", () => {
    test("returns 404 if session not found", async () => {
      req.params = { session_id: "sid" };
      DriveSession.findById.mockResolvedValue(null);

      await driveSessionController.endDriveSessionAndStartRest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Drive session not found");
    });

    test("returns 400 if session already ended", async () => {
      req.params = { session_id: "sid" };
      DriveSession.findById.mockResolvedValue({ end_time: new Date() });

      await driveSessionController.endDriveSessionAndStartRest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Session already ended");
    });

    test("returns 500 on error", async () => {
      req.params = { session_id: "sid" };
      DriveSession.findById.mockImplementation(() => {
        throw new Error("fail");
      });

      await driveSessionController.endDriveSessionAndStartRest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
    // Add more edge cases as needed
  });

  describe("getSessionsByTrip", () => {
    test("returns 404 if trip not found", async () => {
      req.params = { tripId: "tid" };
      Trip.findById.mockResolvedValue(null);

      await driveSessionController.getSessionsByTrip(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Trip not found");
    });

    test("returns 403 if driver not authorized", async () => {
      req.params = { tripId: "tid" };
      req.user = { _id: "driverId", role: "driver" };
      Trip.findById.mockResolvedValue({ driver_id: "otherId" });

      await driveSessionController.getSessionsByTrip(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith("Access denied");
    });

    test("returns sessions on success", async () => {
      req.params = { tripId: "tid" };
      req.user = { _id: "driverId", role: "driver" };
      Trip.findById.mockResolvedValue({ driver_id: "driverId" });
      DriveSession.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await driveSessionController.getSessionsByTrip(req, res);

      expect(res.send).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });
  });
});
