const { Truck } = require("../models/truck");
const { validateTruck } = require("../validationModels/validateTruck");
const truckController = require("../controllers/truckController");

jest.mock("../models/truck");
jest.mock("../validationModels/validateTruck");

describe("truckController", () => {
  let req, res;
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: "owner123", role: "owner" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("createTruck", () => {
    it("should return 400 if validation fails", async () => {
      validateTruck.mockReturnValue({
        error: { details: [{ message: "Invalid data" }] },
      });
      await truckController.createTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Invalid data");
    });
    it("should create truck and return 201", async () => {
      validateTruck.mockReturnValue({});
      req.body = {
        plate_number: "ABC123",
        condition: "good",
        mileage_factor: 1.2,
      };
      const mockSave = jest.fn().mockResolvedValue(true);
      Truck.mockImplementation(() => ({
        ...req.body,
        owner_id: req.user._id,
        save: mockSave,
      }));
      await truckController.createTruck(req, res);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          plate_number: "ABC123",
          owner_id: "owner123",
        })
      );
    });
  });

  describe("getAllTrucks", () => {
    it("should return trucks for owner", async () => {
      req.user.role = "owner";
      const trucks = [{ _id: "t1" }, { _id: "t2" }];
      Truck.find.mockResolvedValue(trucks);
      await truckController.getAllTrucks(req, res);
      expect(Truck.find).toHaveBeenCalledWith({ owner_id: "owner123" });
      expect(res.send).toHaveBeenCalledWith(trucks);
    });
    it("should return trucks for admin", async () => {
      req.user.role = "admin";
      const trucks = [{ _id: "t1" }, { _id: "t2" }];
      Truck.find.mockResolvedValue(trucks);
      await truckController.getAllTrucks(req, res);
      expect(Truck.find).toHaveBeenCalledWith({});
      expect(res.send).toHaveBeenCalledWith(trucks);
    });
    it("should return 403 for driver", async () => {
      req.user.role = "driver";
      await truckController.getAllTrucks(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Drivers are not permitted to view truck list.",
      });
    });
    it("should return 403 for unauthorized role", async () => {
      req.user.role = "other";
      await truckController.getAllTrucks(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized role" });
    });
  });

  describe("getTruckById", () => {
    it("should return 400 if id is missing or invalid", async () => {
      req.params.id = "";
      await truckController.getTruckById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Invalid or missing truck ID");
    });
    it("should return 404 if truck not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      Truck.findById.mockResolvedValue(null);
      await truckController.getTruckById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Truck not found");
    });
    it("should return truck if found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      const truck = { _id: "t1", plate_number: "ABC123" };
      Truck.findById.mockResolvedValue(truck);
      await truckController.getTruckById(req, res);
      expect(res.send).toHaveBeenCalledWith(truck);
    });
  });

  describe("updateTruck", () => {
    it("should return 400 if id is missing or invalid", async () => {
      req.params.id = "";
      await truckController.updateTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Invalid or missing truck ID");
    });
    it("should return 400 if validation fails", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      validateTruck.mockReturnValue({
        error: { details: [{ message: "Invalid data" }] },
      });
      await truckController.updateTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Invalid data");
    });
    it("should return 404 if truck not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      validateTruck.mockReturnValue({});
      Truck.findByIdAndUpdate.mockResolvedValue(null);
      await truckController.updateTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Truck not found");
    });
    it("should update truck and return it", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      validateTruck.mockReturnValue({});
      req.body = {
        plate_number: "XYZ789",
        condition: "excellent",
        mileage_factor: 1.5,
      };
      const truck = { _id: "507f1f77bcf86cd799439011", plate_number: "XYZ789" };
      Truck.findByIdAndUpdate.mockResolvedValue(truck);
      await truckController.updateTruck(req, res);
      expect(Truck.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({ plate_number: "XYZ789" }),
        { new: true }
      );
      expect(res.send).toHaveBeenCalledWith(truck);
    });
  });

  describe("deleteTruck", () => {
    it("should return 400 if id is missing or invalid", async () => {
      req.params.id = "";
      await truckController.deleteTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Invalid or missing truck ID");
    });
    it("should return 404 if truck not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      validateTruck.mockReturnValue({});
      Truck.findByIdAndDelete.mockResolvedValue(null);
      await truckController.deleteTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Truck not found");
    });
    it("should delete truck and return success message", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = {
        plate_number: "ABC123",
        condition: "good",
        mileage_factor: 1.2,
      };
      Truck.findByIdAndDelete.mockResolvedValue(req.body);
      await truckController.deleteTruck(req, res);
      expect(res.send).toHaveBeenCalledWith({
        message: "Truck deleted successfully",
      });
    });
    it("should return 500 on server error", async () => {
      req.user.role = "owner";
      Truck.find.mockRejectedValue(new Error("fail"));
      await truckController.getAllTrucks(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Server Error");
    });
    it("should return 500 on server error", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      Truck.findById.mockRejectedValue(new Error("fail"));
      await truckController.getTruckById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Server Error");
    });
    it("should return 500 on server error", async () => {
      validateTruck.mockReturnValue({});
      req.params.id = "507f1f77bcf86cd799439011";
      Truck.findByIdAndUpdate.mockRejectedValue(new Error("fail"));
      await truckController.updateTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Server Error");
    });
    it("should return 500 on server error", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      Truck.findByIdAndDelete.mockRejectedValue(new Error("fail"));
      await truckController.deleteTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Server Error");
    });
    it("should return 404 if truck not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      Truck.findByIdAndDelete.mockResolvedValue(null);
      await truckController.deleteTruck(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Truck not found");
    });
    it("should delete truck and return success message", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      const truck = { _id: "507f1f77bcf86cd799439011", plate_number: "ABC123" };
      Truck.findByIdAndDelete.mockResolvedValue(truck);
      await truckController.deleteTruck(req, res);
      expect(res.send).toHaveBeenCalledWith({
        message: "Truck deleted successfully",
      });
    });
  });
});
