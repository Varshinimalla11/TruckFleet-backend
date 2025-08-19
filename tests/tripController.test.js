// tests/tripController.test.js

jest.mock("config", () => ({
  get: (key) => {
    if (key === "jwtSecret" || key === "jwtPrivateKey") return "testsecret";
    if (key === "email.user") return "test@example.com";
    if (key === "email.pass") return "testpass";
    if (key === "socket.corsOrigin") return "http://localhost";
    if (key === "socket.path") return "/socket.io";
    return null;
  },
}));

const Trip = require('../models/trip');
const DriveSession = require('../models/driveSession');
const RestLog = require('../models/restLog');
const notifyUser = require('../utils/notifyUser');
const { validateTrip } = require('../validationModels/validateTrip');
const tripController = require('../controllers/tripController');

jest.mock('../models/trip');
jest.mock('../models/driveSession');
jest.mock('../models/restLog');
jest.mock('../utils/notifyUser');
jest.mock('../validationModels/validateTrip');

// Helper for Mongoose query chains with populate and then support
function createQueryChainMock(data) {
  const mock = {
    populate: jest.fn().mockReturnThis(),
    then: jest.fn((cb) => cb(data)),
    catch: jest.fn(),
  };
  return mock;
}

describe('tripController', () => {
  describe('createTrip', () => {
    it('should return 400 if validation fails', async () => {
      validateTrip.mockReturnValue({ error: { details: [{ message: 'Invalid data' }] } });
      await tripController.createTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid data');
    });
    it('should return 403 if user is driver', async () => {
      req.user.role = 'driver';
      validateTrip.mockReturnValue({});
      await tripController.createTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Drivers cannot create trips.');
    });
    it('should create trip and notify users', async () => {
      validateTrip.mockReturnValue({});
      req.body = {
        truck_id: 'truck1',
        driver_id: 'driver123',
        driver_snapshot: { name: 'Test Driver' },
        start_city: 'A',
        end_city: 'B',
        total_km: 100,
        cargo_weight: 2000,
        fuel_start: 50,
        start_time: new Date(),
      };
      const mockSave = jest.fn().mockResolvedValue(true);
      Trip.mockImplementation(() => ({ ...req.body, owner_id: req.user._id, save: mockSave }));
      notifyUser.mockResolvedValue();
      await tripController.createTrip(req, res);
      expect(mockSave).toHaveBeenCalled();
      expect(notifyUser).toHaveBeenCalledWith('driver123', expect.stringContaining('New trip assigned'));
      expect(notifyUser).toHaveBeenCalledWith('owner123', expect.stringContaining('Trip created successfully'));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ truck_id: 'truck1', driver_id: 'driver123' }));
    });
  });

  describe('getTripById', () => {
    it('should return 404 if trip not found', async () => {
      req.params.id = 't1';
      Trip.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(null)),
      });
      await tripController.getTripById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });
    it('should return trip with remaining km', async () => {
      req.params.id = 't1';
      const trip = { _id: 't1', total_km: 100, toObject: () => ({ _id: 't1', total_km: 100 }) };
      Trip.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(trip)),
      });
      const sessions = [{ km_covered: 30 }, { km_covered: 20 }];
      DriveSession.find.mockResolvedValue(sessions);
      await tripController.getTripById(req, res);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ remaining_km_in_trip: 50 }));
    });
   
  });

  describe('startTrip', () => {
    it('should return 404 if trip not found', async () => {
      req.params.id = 't1';
      Trip.findById.mockResolvedValue(null);
      await tripController.startTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });
    it("should return 400 if trip status isn't scheduled", async () => {
      req.params.id = 't1';
      const trip = { status: 'ongoing' };
      Trip.findById.mockResolvedValue(trip);
      await tripController.startTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Trip can only be started if it is in 'scheduled' status.");
    });
    it('should start trip, create session, and notify', async () => {
      req.params.id = 't1';
      const trip = {
        _id: 't1',
        status: 'scheduled',
        driver_id: 'driver123',
        owner_id: 'owner123',
        driver_snapshot: { name: 'Test Driver' },
        start_city: 'A',
        save: jest.fn().mockResolvedValue(true),
      };
      Trip.findById.mockResolvedValue(trip);
      const firstSession = { _id: 'ds1', trip_id: 't1', start_time: new Date(), save: jest.fn().mockResolvedValue(true) };
      DriveSession.mockImplementation(() => firstSession);
      notifyUser.mockResolvedValue();
      await tripController.startTrip(req, res);
      expect(trip.save).toHaveBeenCalled();
      expect(firstSession.save).toHaveBeenCalled();
      expect(notifyUser).toHaveBeenCalledWith('driver123', expect.stringContaining('Your trip has started'));
      expect(notifyUser).toHaveBeenCalledWith('owner123', expect.stringContaining('has started the trip'));
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Trip started', trip, firstSession }));
    });
  });

  describe('completeTrip', () => {
    it('should return 400 if fuel_left missing', async () => {
      req.body = {};
      await tripController.completeTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'fuel_left is required to complete the trip' });
    });
    it('should return 404 if trip not found', async () => {
      req.body = { fuel_left: 10 };
      req.params.id = 't1';
      Trip.findById.mockResolvedValue(null);
      await tripController.completeTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Trip not found' });
    });
    it('should return 400 if trip already completed', async () => {
      req.body = { fuel_left: 10 };
      req.params.id = 't1';
      Trip.findById.mockResolvedValue({ status: 'completed' });
      await tripController.completeTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Trip is already completed' });
    });
    it('should complete trip, close sessions, and notify', async () => {
      req.body = { fuel_left: 10 };
      req.params.id = 't1';
      const trip = {
        _id: 't1',
        status: 'ongoing',
        driver_id: 'driver123',
        owner_id: 'owner123',
        driver_snapshot: { name: 'Test Driver' },
        start_city: 'A',
        end_city: 'B',
        save: jest.fn().mockResolvedValue(true),
      };
      Trip.findById.mockResolvedValue(trip);
      const openDrive = { end_time: null, fuel_end: null, save: jest.fn().mockResolvedValue(true) };
      DriveSession.findOne.mockResolvedValue(openDrive);
      const openRest = { rest_end_time: null, fuel_at_rest_end: null, save: jest.fn().mockResolvedValue(true) };
      RestLog.findOne.mockResolvedValue(openRest);
      notifyUser.mockResolvedValue();
      await tripController.completeTrip(req, res);
      expect(openDrive.save).toHaveBeenCalled();
      expect(openRest.save).toHaveBeenCalled();
      expect(trip.save).toHaveBeenCalled();
      expect(notifyUser).toHaveBeenCalledWith('driver123', expect.stringContaining('completed the trip successfully'));
      expect(notifyUser).toHaveBeenCalledWith('owner123', expect.stringContaining('has completed the trip'));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Trip completed successfully', trip }));
    });
    it('should handle errors and return 500', async () => {
      req.body = { fuel_left: 10 };
      req.params.id = 't1';
      Trip.findById.mockRejectedValue(new Error('DB error'));
      await tripController.completeTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('updateTrip', () => {
    it('should return 404 if trip not found', async () => {
      req.params.id = 't1';
      Trip.findById.mockResolvedValue(null);
      await tripController.updateTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });
    it('should return 400 if trip is completed or cancelled', async () => {
      req.params.id = 't1';
      req.user.role = 'owner';
      Trip.findById.mockResolvedValue({ status: 'completed' });
      await tripController.updateTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Cannot update a completed or cancelled trip.');
    });
    it('should return 403 if user is driver', async () => {
      req.params.id = 't1';
      req.user.role = 'driver';
      Trip.findById.mockResolvedValue({ status: 'ongoing' });
      await tripController.updateTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Drivers cannot update trips.');
    });
    it('should update allowed fields and return success', async () => {
      req.params.id = 't1';
      req.user.role = 'owner';
      const trip = { status: 'ongoing', save: jest.fn().mockResolvedValue(true) };
      Trip.findById.mockResolvedValue(trip);
      req.body = { start_city: 'A', end_city: 'B', total_km: 200 };
      await tripController.updateTrip(req, res);
      expect(trip.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Trip updated successfully', trip }));
    });
    it('should handle errors and return 500', async () => {
      req.params.id = 't1';
      Trip.findById.mockRejectedValue(new Error('DB error'));
      await tripController.updateTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('deleteTrip', () => {
    it('should return 404 if trip not found', async () => {
      req.params.id = 't1';
      Trip.findById.mockResolvedValue(null);
      await tripController.deleteTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });
    it('should soft delete trip', async () => {
      req.params.id = 't1';
      const trip = { isDeleted: false, save: jest.fn().mockResolvedValue(true) };
      Trip.findById.mockResolvedValue(trip);
      await tripController.deleteTrip(req, res);
      expect(trip.isDeleted).toBe(true);
      expect(trip.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ message: 'Trip soft-deleted' });
    });
  });

  describe('restoreTrip', () => {
    it('should return 404 if trip not found', async () => {
      req.params.id = 't1';
      Trip.findById.mockResolvedValue(null);
      await tripController.restoreTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });
    it('should return 400 if trip is not deleted', async () => {
      req.params.id = 't1';
      const trip = { isDeleted: false };
      Trip.findById.mockResolvedValue(trip);
      await tripController.restoreTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Trip is not deleted.');
    });
    it('should restore trip', async () => {
      req.params.id = 't1';
      const trip = { isDeleted: true, save: jest.fn().mockResolvedValue(true) };
      Trip.findById.mockResolvedValue(trip);
      await tripController.restoreTrip(req, res);
      expect(trip.isDeleted).toBe(false);
      expect(trip.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ message: 'Trip restored successfully', trip });
    });
  });

  describe('cancelTrip', () => {
    it('should return 404 if trip not found', async () => {
      req.params.id = 't1';
      Trip.findById.mockResolvedValue(null);
      await tripController.cancelTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });
    it('should return 400 if trip is completed', async () => {
      req.params.id = 't1';
      const trip = { status: 'completed' };
      Trip.findById.mockResolvedValue(trip);
      await tripController.cancelTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Completed trips cannot be cancelled.');
    });
    it('should return 400 if trip is already cancelled', async () => {
      req.params.id = 't1';
      const trip = { status: 'cancelled' };
      Trip.findById.mockResolvedValue(trip);
      await tripController.cancelTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Trip is already cancelled.');
    });
    it('should cancel trip and notify users', async () => {
      req.params.id = 't1';
      const trip = {
        status: 'ongoing',
        driver_id: 'driver123',
        owner_id: 'owner123',
        start_city: 'A',
        end_city: 'B',
        save: jest.fn().mockResolvedValue(true),
      };
      Trip.findById.mockResolvedValue(trip);
      notifyUser.mockResolvedValue();
      await tripController.cancelTrip(req, res);
      expect(trip.status).toBe('cancelled');
      expect(trip.save).toHaveBeenCalled();
      expect(notifyUser).toHaveBeenCalledWith('driver123', expect.stringContaining('Your trip has been cancelled'));
      expect(notifyUser).toHaveBeenCalledWith('owner123', expect.stringContaining('was cancelled'));
      expect(res.send).toHaveBeenCalledWith({ message: 'Trip cancelled successfully', trip });
    });
  });
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'owner123', role: 'owner' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('getAllTrips', () => {
    it('should return 403 for driver role', async () => {
      req.user.role = 'driver';

      await tripController.getAllTrips(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Drivers are not allowed to view all trips.');
    });

    it('should return trips for owner', async () => {
      req.user.role = 'owner';
      req.query.showDeleted = 'false';

      const trips = [{ _id: 'trip1' }, { _id: 'trip2' }];

      Trip.find.mockReturnValue(createQueryChainMock(trips));

      await tripController.getAllTrips(req, res);

      expect(Trip.find).toHaveBeenCalledWith({ owner_id: 'owner123', isDeleted: false });
      expect(res.send).toHaveBeenCalledWith(trips);
    });

    
  });

  describe('getMyTrips', () => {
    it('should return 403 if user not driver', async () => {
      req.user.role = 'owner';
      await tripController.getMyTrips(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Only drivers can view their trips.');
    });

    it('should return trips for driver', async () => {
      req.user.role = 'driver';
      req.user._id = 'driver123';

      const trips = [{ _id: 'trip1' }, { _id: 'trip2' }];

      Trip.find.mockReturnValue(createQueryChainMock(trips));

      await tripController.getMyTrips(req, res);

      expect(Trip.find).toHaveBeenCalledWith({ driver_id: 'driver123', isDeleted: false });
      expect(res.send).toHaveBeenCalledWith(trips);
    });

    it('should handle errors and send 500', async () => {
      req.user.role = 'driver';
      req.user._id = 'driver123';
      Trip.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn(() => { throw new Error('DB error'); }),
        catch: jest.fn((cb) => cb(new Error('DB error'))),
      });
      await tripController.getMyTrips(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal Server Error');
    });
  });

  // Additional tests for other controller functions can be added similarly
});
