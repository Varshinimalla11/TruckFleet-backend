// tests/dashboardController.test.js

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

const dashboardController = require("../../../TFM_Backend/controllers/dashboardController");
const { Truck } = require("../../../TFM_Backend/models/truck");
const Trip = require("../../../TFM_Backend/models/trip");
const DriveSession = require("../../../TFM_Backend/models/driveSession");
const { User } = require("../../../TFM_Backend/models/user");

jest.mock("../models/truck");
jest.mock("../models/trip");
jest.mock("../models/driveSession");
jest.mock("../models/user");

// Helper to create thenable mocks to mimic mongoose chained queries awaited without exec()
function createThenableMock(data) {
  const mock = {
    sort: jest.fn(() => mock),
    limit: jest.fn(() => mock),
    populate: jest.fn(() => mock),
    select: jest.fn(() => mock),
    then: jest.fn((onFulfilled) => {
      onFulfilled(data);
      return Promise.resolve();
    }),
    catch: jest.fn(() => mock),
  };
  return mock;
}

describe("Dashboard Controller", () => {
  let req;
  let res;
  const sampleTrips = [{ id: "trip1" }, { id: "trip2" }];
  const sampleDriveSessions = [{ id: "sess1" }, { id: "sess2" }];
  const sampleTripIds = [{ _id: "trip1" }, { _id: "trip2" }];

  beforeEach(() => {
    req = {
      user: { _id: "user123", role: "owner" },
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();

    Truck.countDocuments.mockResolvedValue(5);
    Trip.countDocuments.mockImplementation((filter) => {
      if (filter && filter.status === "ongoing") return Promise.resolve(2);
      return Promise.resolve(10);
    });
    DriveSession.countDocuments.mockResolvedValue(7);
    User.countDocuments.mockResolvedValue(7);

    Trip.find.mockReturnValue(createThenableMock(sampleTrips));
    DriveSession.find.mockReturnValue(createThenableMock(sampleDriveSessions));
  });

  describe("getStats", () => {
    test("returns correct stats for owner", async () => {
      await dashboardController.getStats(req, res);

      expect(Truck.countDocuments).toHaveBeenCalledWith({
        owner_id: "user123",
      });
      expect(Trip.countDocuments).toHaveBeenCalledWith({
        owner_id: "user123",
        isDeleted: false,
      });
      expect(User.countDocuments).toHaveBeenCalledWith({
        role: "driver",
        ownedBy: "user123",
      });
      expect(DriveSession.countDocuments).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        totalTrucks: 5,
        totalTrips: 10,
        totalDrivers: 7,
        ongoingTrips: 2,
      });
    });

    test("returns correct stats for driver", async () => {
      req.user.role = "driver";

      Truck.countDocuments.mockResolvedValue(0);
      Trip.countDocuments.mockImplementation((filter) => {
        if (filter && filter.status === "ongoing") return Promise.resolve(4);
        if (filter && filter.driver_id) return Promise.resolve(7);
        return Promise.resolve(0);
      });
      DriveSession.countDocuments.mockResolvedValue(3);
      User.countDocuments.mockResolvedValue(0);

      await dashboardController.getStats(req, res);

      expect(Truck.countDocuments).toHaveBeenCalledWith({});
      expect(Trip.countDocuments).toHaveBeenCalledWith({
        driver_id: "user123",
        isDeleted: false,
      });
      expect(User.countDocuments).toHaveBeenCalledWith({});

      expect(res.json).toHaveBeenCalledWith({
        totalTrucks: 0,
        totalTrips: 7,
        totalDrivers: 0,
        ongoingTrips: 4,
      });
    });

    test("handles errors gracefully", async () => {
      Truck.countDocuments.mockRejectedValue(new Error("DB error"));

      await dashboardController.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("getRecentTrips", () => {
    beforeEach(() => {
      Trip.find.mockReturnValue(createThenableMock(sampleTrips));
    });

    test("returns recent trips for owner", async () => {
      await dashboardController.getRecentTrips(req, res);

      expect(Trip.find).toHaveBeenCalledWith({
        owner_id: "user123",
        isDeleted: false,
      });
      expect(Trip.find().sort).toHaveBeenCalledWith({ start_time: -1 });
      expect(Trip.find().limit).toHaveBeenCalledWith(5);
      expect(Trip.find().populate).toHaveBeenCalledWith("truck_id");
      expect(Trip.find().populate).toHaveBeenCalledWith("driver_id");
      expect(res.json).toHaveBeenCalledWith(sampleTrips);
    });

    test("returns recent trips for driver", async () => {
      req.user.role = "driver";

      await dashboardController.getRecentTrips(req, res);

      expect(Trip.find).toHaveBeenCalledWith({
        driver_id: "user123",
        isDeleted: false,
      });
      expect(res.json).toHaveBeenCalledWith(sampleTrips);
    });

    test("handles errors gracefully", async () => {
      Trip.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.reject(new Error("DB error"))),
        catch: jest.fn(),
      });

      await dashboardController.getRecentTrips(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("getRecentDriveSessions", () => {
    beforeEach(() => {
      Trip.find.mockReturnValue({
        select: jest.fn(() => createThenableMock(sampleTripIds)),
        then: jest.fn(() => Promise.resolve(sampleTripIds)),
      });
      DriveSession.find.mockReturnValue(
        createThenableMock(sampleDriveSessions)
      );
    });

    test("returns recent drive sessions for owner", async () => {
      await dashboardController.getRecentDriveSessions(req, res);

      expect(Trip.find).toHaveBeenCalledWith({ owner_id: "user123" });
      expect(Trip.find().select).toHaveBeenCalledWith("_id");
      expect(DriveSession.find).toHaveBeenCalledWith({
        trip_id: { $in: ["trip1", "trip2"] },
      });
      expect(DriveSession.find().sort).toHaveBeenCalledWith({ start_time: -1 });
      expect(DriveSession.find().limit).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith(sampleDriveSessions);
    });

    test("returns recent drive sessions for driver", async () => {
      req.user.role = "driver";

      const driverTrips = [{ _id: "trip3" }, { _id: "trip4" }];

      Trip.find.mockReturnValueOnce({
        select: jest.fn(() => createThenableMock(driverTrips)),
        then: jest.fn(() => Promise.resolve(driverTrips)),
      });

      await dashboardController.getRecentDriveSessions(req, res);

      expect(Trip.find).toHaveBeenCalledWith({ driver_id: "user123" });
      expect(DriveSession.find).toHaveBeenCalledWith({
        trip_id: { $in: ["trip3", "trip4"] },
      });
    });

    test("handles errors gracefully", async () => {
      Trip.find.mockReturnValue({
        select: jest.fn(() => ({
          then: jest.fn(() => Promise.reject(new Error("DB error"))),
        })),
      });

      await dashboardController.getRecentDriveSessions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });
});
