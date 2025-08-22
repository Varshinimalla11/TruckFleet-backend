const RefuelEvent = require("../../../TFM_Backend/models/refuelEvent");
const Trip = require("../../../TFM_Backend/models/trip");
const validateRefuelEvent = require("../../../TFM_Backend/validationModels/validateRefuel");
const notifyUser = require("../../../TFM_Backend/utils/notifyUser");
const refuelEventController = require("../../../TFM_Backend/controllers/refuelEventController");

jest.mock("../models/refuelEvent");
jest.mock("../models/trip");
jest.mock("../validationModels/validateRefuel");
jest.mock("../utils/notifyUser");

describe("refuelEventController", () => {
  let req, res;
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: "user123", role: "driver" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("logRefuel", () => {
    it("should return 400 if validation fails", async () => {
      validateRefuelEvent.mockReturnValue({
        error: { details: [{ message: "Invalid data" }] },
      });
      await refuelEventController.logRefuel(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Invalid data");
    });

    it("should return 404 if trip not found", async () => {
      validateRefuelEvent.mockReturnValue({});
      Trip.findById.mockResolvedValue(null);
      req.body.trip_id = "trip1";
      await refuelEventController.logRefuel(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Trip not found");
    });

    it("should return 403 if driver not authorized", async () => {
      validateRefuelEvent.mockReturnValue({});
      req.user.role = "driver";
      req.user._id = "driver123";
      const trip = { driver_id: "otherDriver", owner_id: "owner123" };
      Trip.findById.mockResolvedValue(trip);
      req.body.trip_id = "trip1";
      await refuelEventController.logRefuel(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith("Access denied");
    });

    it("should log refuel and notify users", async () => {
      validateRefuelEvent.mockReturnValue({});
      req.body = {
        trip_id: "trip1",
        event_time: "2023-01-01T10:00:00Z",
        fuel_before: 50,
        fuel_added: 20,
        payment_mode: "cash",
      };
      const trip = {
        driver_id: "user123",
        owner_id: "owner123",
        driver_snapshot: { name: "Test Driver" },
      };
      Trip.findById.mockResolvedValue(trip);
      const mockSave = jest.fn().mockResolvedValue(true);
      RefuelEvent.mockImplementation(() => ({ save: mockSave }));
      notifyUser.mockResolvedValue();
      await refuelEventController.logRefuel(req, res);
      expect(mockSave).toHaveBeenCalled();
      expect(notifyUser).toHaveBeenCalledWith(
        "user123",
        expect.stringContaining("Refuel log added successfully")
      );
      expect(notifyUser).toHaveBeenCalledWith(
        "owner123",
        expect.stringContaining("logged a refuel")
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });
  });

  describe("getRefuelLogsByTrip", () => {
    it("should return 404 if trip not found", async () => {
      req.params.tripId = "trip1";
      Trip.findById.mockResolvedValue(null);
      await refuelEventController.getRefuelLogsByTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Trip not found");
    });

    it("should return 403 if driver not authorized", async () => {
      req.params.tripId = "trip1";
      req.user.role = "driver";
      req.user._id = "driver123";
      const trip = { driver_id: "otherDriver", owner_id: "owner123" };
      Trip.findById.mockResolvedValue(trip);
      await refuelEventController.getRefuelLogsByTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith("Access denied");
    });

    it("should return logs for authorized driver", async () => {
      req.params.tripId = "trip1";
      req.user.role = "driver";
      req.user._id = "driver123";
      const trip = { driver_id: "driver123", owner_id: "owner123" };
      const logs = [{ _id: "log1" }, { _id: "log2" }];
      Trip.findById.mockResolvedValue(trip);
      RefuelEvent.find.mockResolvedValue(logs);
      await refuelEventController.getRefuelLogsByTrip(req, res);
      expect(RefuelEvent.find).toHaveBeenCalledWith({ trip_id: "trip1" });
      expect(res.send).toHaveBeenCalledWith(logs);
    });
  });
});
