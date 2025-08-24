import { jest } from '@jest/globals';

// Mock models
jest.unstable_mockModule('../models/trip.js', () => {
  const mockTripConstructor = jest.fn().mockImplementation(() => ({
    save: jest.fn()
  }));
  
  // Add static methods with populate chaining
  const mockFind = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([])
    })
  });
  
  const mockFindOne = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(null)
    })
  });
  
  // Mock findById to return a mock trip object
  const mockFindById = jest.fn();
  
  mockTripConstructor.find = mockFind;
  mockTripConstructor.findOne = mockFindOne;
  mockTripConstructor.findById = mockFindById;
  mockTripConstructor.findByIdAndUpdate = jest.fn();
  
  return {
    default: mockTripConstructor
  };
});

jest.unstable_mockModule('../models/driveSession.js', () => {
  const mockDriveSessionConstructor = jest.fn().mockImplementation(() => ({
    save: jest.fn()
  }));
  
  // Add static methods
  mockDriveSessionConstructor.find = jest.fn();
  mockDriveSessionConstructor.findOne = jest.fn();
  
  return {
    default: mockDriveSessionConstructor
  };
});

jest.unstable_mockModule('../models/restLog.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn()
  }
}));

// Mock validation models
jest.unstable_mockModule('../validationModels/validateTrip.js', () => ({
  validateTrip: jest.fn()
}));

// Mock utilities
jest.unstable_mockModule('../utils/notifyUser.js', () => ({
  default: jest.fn()
}));

// Import mocked modules
let Trip, DriveSession, RestLog;
let validateTrip, notifyUser;

// Import controller functions
let createTrip, getAllTrips, getTripById, startTrip, completeTrip, updateTrip, deleteTrip, restoreTrip, cancelTrip, getMyTrips;

beforeAll(async () => {
  // Import mocked modules
  const tripModule = await import('../models/trip.js');
  const driveSessionModule = await import('../models/driveSession.js');
  const restLogModule = await import('../models/restLog.js');
  const validateTripModule = await import('../validationModels/validateTrip.js');
  const notifyUserModule = await import('../utils/notifyUser.js');
  
  Trip = tripModule.default;
  DriveSession = driveSessionModule.default;
  RestLog = restLogModule.default;
  validateTrip = validateTripModule.validateTrip;
  notifyUser = notifyUserModule.default;
  
  // Import controller functions
  const controllerModule = await import('../controllers/tripController.js');
  createTrip = controllerModule.createTrip;
  getAllTrips = controllerModule.getAllTrips;
  getTripById = controllerModule.getTripById;
  startTrip = controllerModule.startTrip;
  completeTrip = controllerModule.completeTrip;
  updateTrip = controllerModule.updateTrip;
  deleteTrip = controllerModule.deleteTrip;
  restoreTrip = controllerModule.restoreTrip;
  cancelTrip = controllerModule.cancelTrip;
  getMyTrips = controllerModule.getMyTrips;
});

// Mock response and request objects
const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
  json: jest.fn(),
});

const createMockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: {},
  ...overrides,
});

describe('Trip Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrip', () => {
    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ 
        body: { 
          truck_id: 'truck123',
          driver_id: 'driver123',
          start_city: 'City A',
          end_city: 'City B'
        },
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      validateTrip.mockReturnValue({ 
        error: { details: [{ message: 'Invalid trip data' }] } 
      });
      
      await createTrip(req, res);
      
      expect(validateTrip).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid trip data');
    });

    it('should return 403 if user is driver', async () => {
      const req = createMockReq({ 
        body: { 
          truck_id: 'truck123',
          driver_id: 'driver123',
          start_city: 'City A',
          end_city: 'City B'
        },
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      validateTrip.mockReturnValue({ error: null });
      
      await createTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Drivers cannot create trips.');
    });

    it('should create trip and return 201 on successful creation', async () => {
      const req = createMockReq({ 
        body: { 
          truck_id: 'truck123',
          driver_id: 'driver123',
          driver_snapshot: { name: 'John Doe' },
          start_city: 'City A',
          end_city: 'City B',
          total_km: 500,
          cargo_weight: 1000,
          fuel_start: 50,
          start_time: new Date()
        },
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      validateTrip.mockReturnValue({ error: null });
      
      const mockTrip = {
        _id: 'trip123',
        truck_id: 'truck123',
        driver_id: 'driver123',
        start_city: 'City A',
        end_city: 'City B',
        total_km: 500,
        owner_id: 'owner123'
      };
      
      const mockTripInstance = {
        ...mockTrip,
        save: jest.fn().mockResolvedValue(mockTrip)
      };
      Trip.mockImplementation(() => mockTripInstance);
      notifyUser.mockResolvedValue();
      
      await createTrip(req, res);
      
      expect(Trip).toHaveBeenCalledWith({
        truck_id: 'truck123',
        driver_id: 'driver123',
        driver_snapshot: { name: 'John Doe' },
        start_city: 'City A',
        end_city: 'City B',
        total_km: 500,
        cargo_weight: 1000,
        fuel_start: 50,
        start_time: expect.any(Date),
        owner_id: 'owner123'
      });
      expect(mockTripInstance.save).toHaveBeenCalled();
      expect(notifyUser).toHaveBeenCalledWith(
        'driver123',
        '🆕 New trip assigned: City A → City B'
      );
      expect(notifyUser).toHaveBeenCalledWith(
        'owner123',
        '🚛 Trip created successfully. Driver assigned.'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(mockTripInstance);
    });
  });

  describe('getAllTrips', () => {
    it('should return 403 if user is driver', async () => {
      const req = createMockReq({ 
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      await getAllTrips(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Drivers are not allowed to view all trips.');
    });

    it('should return trips for owner role with owner filter', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' },
        query: { showDeleted: 'false' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1', start_city: 'City A', end_city: 'City B' },
        { _id: 'trip2', start_city: 'City C', end_city: 'City D' }
      ];
      
      // Mock the populate chain
      const mockPopulateChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrips)
        })
      };
      Trip.find.mockReturnValue(mockPopulateChain);
      
      await getAllTrips(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ 
        owner_id: 'owner123',
        isDeleted: false
      });
      expect(res.send).toHaveBeenCalledWith(mockTrips);
    });

    it('should return all trips for admin role', async () => {
      const req = createMockReq({ 
        user: { _id: 'admin123', role: 'admin' },
        query: { showDeleted: 'false' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1', start_city: 'City A', end_city: 'City B' },
        { _id: 'trip2', start_city: 'City C', end_city: 'City D' }
      ];
      
      // Mock the populate chain
      const mockPopulateChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrips)
        })
      };
      Trip.find.mockReturnValue(mockPopulateChain);
      
      await getAllTrips(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(res.send).toHaveBeenCalledWith(mockTrips);
    });

    it('should handle showDeleted query parameter', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' },
        query: { showDeleted: 'true' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1', start_city: 'City A', isDeleted: true }
      ];
      
      // Mock the populate chain
      const mockPopulateChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrips)
        })
      };
      Trip.find.mockReturnValue(mockPopulateChain);
      
      await getAllTrips(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ 
        owner_id: 'owner123',
        isDeleted: true
      });
    });
  });

  describe('getTripById', () => {
    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      // Mock the populate chain for findOne
      const mockFindOneChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      };
      Trip.findOne.mockReturnValue(mockFindOneChain);
      
      await getTripById(req, res);
      
      expect(Trip.findOne).toHaveBeenCalledWith({
        _id: 'trip123',
        isDeleted: false
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should return trip with remaining km calculation', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        start_city: 'City A',
        end_city: 'City B',
        total_km: 500,
        toObject: jest.fn().mockReturnValue({
          _id: 'trip123',
          start_city: 'City A',
          end_city: 'City B',
          total_km: 500
        })
      };
      
      // Mock the populate chain for findOne
      const mockFindOneChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrip)
        })
      };
      Trip.findOne.mockReturnValue(mockFindOneChain);
      
      const mockSessions = [
        { km_covered: 200 },
        { km_covered: 150 }
      ];
      
      DriveSession.find.mockResolvedValue(mockSessions);
      
      await getTripById(req, res);
      
      expect(DriveSession.find).toHaveBeenCalledWith({ trip_id: 'trip123' });
      expect(res.send).toHaveBeenCalledWith({
        _id: 'trip123',
        start_city: 'City A',
        end_city: 'City B',
        total_km: 500,
        remaining_km_in_trip: 150
      });
    });
  });

  describe('startTrip', () => {
    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      Trip.findById.mockResolvedValue(null);
      
      await startTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should return 400 if trip status is not scheduled', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        status: 'in_progress'
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await startTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        "Trip can only be started if it is in 'scheduled' status."
      );
    });

    it('should start trip and return success message', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        status: 'scheduled',
        driver_snapshot: { name: 'John Doe' },
        start_city: 'City A',
        owner_id: 'owner123',
        save: jest.fn().mockResolvedValue()
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await startTrip(req, res);
      
      expect(mockTrip.status).toBe('ongoing');
      expect(mockTrip.start_time).toBeDefined();
      expect(mockTrip.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({
        message: "Trip started",
        trip: mockTrip,
        firstSession: expect.any(Object)
      });
    });
  });

  describe('completeTrip', () => {
    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ 
        params: { id: 'trip123' },
        body: { fuel_left: 20 }
      });
      const res = createMockRes();
      
      Trip.findById.mockResolvedValue(null);
      
      await completeTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Trip not found' });
    });

    it('should return 400 if trip status is already completed', async () => {
      const req = createMockReq({ 
        params: { id: 'trip123' },
        body: { fuel_left: 20 }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        status: 'completed'
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await completeTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Trip is already completed" 
      });
    });

    it('should complete trip and return success message', async () => {
      const req = createMockReq({ 
        params: { id: 'trip123' },
        body: { fuel_left: 20 }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        status: 'ongoing',
        driver_snapshot: { name: 'John Doe' },
        start_city: 'City A',
        end_city: 'City B',
        owner_id: 'owner123',
        driver_id: 'driver123',
        save: jest.fn().mockResolvedValue()
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      // Mock DriveSession.findOne to return null (no open session)
      DriveSession.findOne.mockResolvedValue(null);
      
      // Mock RestLog.findOne to return null (no open rest log)
      RestLog.findOne.mockResolvedValue(null);
      
      // Mock notifyUser
      notifyUser.mockResolvedValue();
      
      await completeTrip(req, res);
      
      expect(mockTrip.status).toBe('completed');
      expect(mockTrip.trip_end_time).toBeDefined();
      expect(mockTrip.fuel_end).toBe(20);
      expect(mockTrip.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Trip completed successfully",
        trip: mockTrip,
        closedDriveSession: null,
        closedRestLog: null
      });
    });
  });

  describe('updateTrip', () => {
    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ 
        params: { id: 'trip123' },
        body: { start_city: 'New City' }
      });
      const res = createMockRes();
      
      Trip.findById.mockResolvedValue(null);
      
      await updateTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should update trip and return updated trip', async () => {
      const req = createMockReq({ 
        params: { id: 'trip123' },
        body: { 
          start_city: 'New City',
          end_city: 'New End City',
          total_km: 600
        }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        status: 'scheduled',
        save: jest.fn().mockResolvedValue()
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await updateTrip(req, res);
      
      expect(Trip.findById).toHaveBeenCalledWith('trip123');
      expect(mockTrip.start_city).toBe('New City');
      expect(mockTrip.end_city).toBe('New End City');
      expect(mockTrip.total_km).toBe(600);
      expect(mockTrip.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Trip updated successfully", 
        trip: mockTrip 
      });
    });
  });

  describe('deleteTrip', () => {
    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      Trip.findById.mockResolvedValue(null);
      
      await deleteTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should soft delete trip and return success message', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        isDeleted: false,
        save: jest.fn().mockResolvedValue()
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await deleteTrip(req, res);
      
      expect(Trip.findById).toHaveBeenCalledWith('trip123');
      expect(mockTrip.isDeleted).toBe(true);
      expect(mockTrip.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ message: 'Trip soft-deleted' });
    });
  });

  describe('restoreTrip', () => {
    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      Trip.findById.mockResolvedValue(null);
      
      await restoreTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should restore trip and return success message', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        isDeleted: true,
        save: jest.fn().mockResolvedValue()
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await restoreTrip(req, res);
      
      expect(Trip.findById).toHaveBeenCalledWith('trip123');
      expect(mockTrip.isDeleted).toBe(false);
      expect(mockTrip.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ message: 'Trip restored successfully', trip: mockTrip });
    });
  });

  describe('cancelTrip', () => {
    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      Trip.findById.mockResolvedValue(null);
      
      await cancelTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should return 400 if trip status is completed', async () => {
      const req = createMockReq({ params: { id: 'trip123' } });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        status: 'completed'
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await cancelTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        "Completed trips cannot be cancelled."
      );
    });

    it('should cancel trip and return success message', async () => {
      const req = createMockReq({ 
        params: { id: 'trip123' }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        status: 'scheduled',
        driver_id: 'driver123',
        owner_id: 'owner123',
        start_city: 'City A',
        end_city: 'City B',
        save: jest.fn().mockResolvedValue()
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      notifyUser.mockResolvedValue();
      
      await cancelTrip(req, res);
      
      expect(mockTrip.status).toBe('cancelled');
      expect(mockTrip.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ message: 'Trip cancelled successfully', trip: mockTrip });
    });
  });

  describe('getMyTrips', () => {
    it('should return trips for driver user', async () => {
      const req = createMockReq({ 
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1', start_city: 'City A', end_city: 'City B' },
        { _id: 'trip2', start_city: 'City C', end_city: 'City D' }
      ];
      
      // Mock the populate chain
      const mockPopulateChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrips)
        })
      };
      Trip.find.mockReturnValue(mockPopulateChain);
      
      await getMyTrips(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ 
        driver_id: 'driver123',
        isDeleted: false
      });
      expect(res.send).toHaveBeenCalledWith(mockTrips);
    });

    it('should return 403 for non-driver users', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      await getMyTrips(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Only drivers can view their trips.');
    });
  });
});
