import { jest } from '@jest/globals';

// Mock models
jest.unstable_mockModule('../models/trip.js', () => ({
  default: {
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule('../models/driveSession.js', () => ({
  default: {
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule('../models/truck.js', () => ({
  Truck: {
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule('../models/user.js', () => ({
  User: {
    countDocuments: jest.fn()
  }
}));

// Import mocked modules
let Trip, DriveSession, Truck, User;

// Import controller functions
let getStats, getRecentTrips, getRecentDriveSessions;

beforeAll(async () => {
  // Import mocked modules
  const tripModule = await import('../models/trip.js');
  const driveSessionModule = await import('../models/driveSession.js');
  const truckModule = await import('../models/truck.js');
  const userModule = await import('../models/user.js');
  
  Trip = tripModule.default;
  DriveSession = driveSessionModule.default;
  Truck = truckModule.Truck;
  User = userModule.User;
  
  // Import controller functions
  const controllerModule = await import('../controllers/dashboardController.js');
  getStats = controllerModule.getStats;
  getRecentTrips = controllerModule.getRecentTrips;
  getRecentDriveSessions = controllerModule.getRecentDriveSessions;
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

describe('Dashboard Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return stats for owner role', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      // Mock countDocuments for each model
      Truck.countDocuments.mockResolvedValue(5);
      Trip.countDocuments.mockResolvedValue(10);
      User.countDocuments.mockResolvedValue(3);
      DriveSession.countDocuments.mockResolvedValue(25);
      
      await getStats(req, res);
      
      // Verify filters are applied correctly for owner
      expect(Truck.countDocuments).toHaveBeenCalledWith({ owner_id: 'owner123' });
      expect(Trip.countDocuments).toHaveBeenCalledWith({ 
        isDeleted: false,
        owner_id: 'owner123'
      });
      expect(User.countDocuments).toHaveBeenCalledWith({ 
        role: 'driver',
        ownedBy: 'owner123'
      });
      
      // Verify response
      expect(res.json).toHaveBeenCalledWith({
        totalTrucks: 5,
        totalTrips: 10,
        totalDrivers: 3,
        ongoingTrips: 10 // This should be mocked separately for ongoing trips
      });
    });

    it('should return stats for driver role', async () => {
      const req = createMockReq({ 
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      // Mock countDocuments for each model
      Truck.countDocuments.mockResolvedValue(0);
      Trip.countDocuments.mockResolvedValue(5);
      User.countDocuments.mockResolvedValue(0);
      DriveSession.countDocuments.mockResolvedValue(15);
      
      await getStats(req, res);
      
      // Verify filters are applied correctly for driver
      expect(Truck.countDocuments).toHaveBeenCalledWith({});
      expect(Trip.countDocuments).toHaveBeenCalledWith({ 
        isDeleted: false,
        driver_id: 'driver123'
      });
      expect(User.countDocuments).toHaveBeenCalledWith({});
      
      // Verify response
      expect(res.json).toHaveBeenCalledWith({
        totalTrucks: 0,
        totalTrips: 5,
        totalDrivers: 0,
        ongoingTrips: 5
      });
    });

    it('should return stats for admin role', async () => {
      const req = createMockReq({ 
        user: { _id: 'admin123', role: 'admin' }
      });
      const res = createMockRes();
      
      // Mock countDocuments for each model
      Truck.countDocuments.mockResolvedValue(15);
      Trip.countDocuments.mockResolvedValue(25);
      User.countDocuments.mockResolvedValue(8);
      DriveSession.countDocuments.mockResolvedValue(50);
      
      await getStats(req, res);
      
      // Verify filters are applied correctly for admin (no additional filters)
      expect(Truck.countDocuments).toHaveBeenCalledWith({});
      expect(Trip.countDocuments).toHaveBeenCalledWith({ isDeleted: false });
      expect(User.countDocuments).toHaveBeenCalledWith({ role: 'driver' });
      
      // Verify response
      expect(res.json).toHaveBeenCalledWith({
        totalTrucks: 15,
        totalTrips: 25,
        totalDrivers: 8,
        ongoingTrips: 25
      });
    });

    it('should handle ongoing trips count correctly', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      // Mock countDocuments for each model
      Truck.countDocuments.mockResolvedValue(5);
      Trip.countDocuments.mockResolvedValue(10);
      User.countDocuments.mockResolvedValue(3);
      DriveSession.countDocuments.mockResolvedValue(25);
      
      // Mock ongoing trips count
      Trip.countDocuments
        .mockResolvedValueOnce(10) // First call for total trips
        .mockResolvedValueOnce(3); // Second call for ongoing trips
      
      await getStats(req, res);
      
      // Verify ongoing trips filter
      expect(Trip.countDocuments).toHaveBeenCalledWith({ 
        isDeleted: false,
        owner_id: 'owner123',
        status: 'ongoing'
      });
      
      expect(res.json).toHaveBeenCalledWith({
        totalTrucks: 5,
        totalTrips: 10,
        totalDrivers: 3,
        ongoingTrips: 3
      });
    });

    it('should handle server error', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      // Mock error
      Truck.countDocuments.mockRejectedValue(new Error('Database error'));
      
      await getStats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('getRecentTrips', () => {
    it('should return recent trips for owner role', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1', start_city: 'City A', end_city: 'City B' },
        { _id: 'trip2', start_city: 'City C', end_city: 'City D' }
      ];
      
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          callback(mockTrips);
          return { catch: jest.fn() };
        })
      };
      
      Trip.find.mockReturnValue(mockQueryChain);
      
      await getRecentTrips(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ 
        isDeleted: false,
        owner_id: 'owner123'
      });
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ start_time: -1 });
      expect(mockQueryChain.limit).toHaveBeenCalledWith(5);
      expect(mockQueryChain.populate).toHaveBeenCalledWith('truck_id');
      expect(mockQueryChain.populate).toHaveBeenCalledWith('driver_id');
      expect(res.json).toHaveBeenCalledWith(mockTrips);
    });

    it('should return recent trips for driver role', async () => {
      const req = createMockReq({ 
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1', start_city: 'City A', end_city: 'City B' }
      ];
      
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          callback(mockTrips);
          return { catch: jest.fn() };
        })
      };
      
      Trip.find.mockReturnValue(mockQueryChain);
      
      await getRecentTrips(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ 
        isDeleted: false,
        driver_id: 'driver123'
      });
      expect(res.json).toHaveBeenCalledWith(mockTrips);
    });

    it('should return recent trips for admin role', async () => {
      const req = createMockReq({ 
        user: { _id: 'admin123', role: 'admin' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1', start_city: 'City A', end_city: 'City B' },
        { _id: 'trip2', start_city: 'City C', end_city: 'City D' },
        { _id: 'trip3', start_city: 'City E', end_city: 'City F' }
      ];
      
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          callback(mockTrips);
          return { catch: jest.fn() };
        })
      };
      
      Trip.find.mockReturnValue(mockQueryChain);
      
      await getRecentTrips(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(res.json).toHaveBeenCalledWith(mockTrips);
    });

    it('should handle server error', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockReturnValue({
          catch: jest.fn().mockImplementation((callback) => {
            callback();
            return;
          })
        })
      };
      
      Trip.find.mockReturnValue(mockQueryChain);
      
      await getRecentTrips(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('getRecentDriveSessions', () => {
    it('should return recent drive sessions for owner role', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1' },
        { _id: 'trip2' }
      ];
      
      const mockSessions = [
        { _id: 'session1', trip_id: 'trip1', start_time: new Date() },
        { _id: 'session2', trip_id: 'trip2', start_time: new Date() }
      ];
      
      // Mock Trip.find for getting trip IDs
      const mockTripQueryChain = {
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockImplementation((callback) => {
            callback(mockTrips);
            return { catch: jest.fn() };
          })
        })
      };
      
      // Mock DriveSession.find for getting sessions
      const mockSessionQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          callback(mockSessions);
          return;
        })
      };
      
      Trip.find.mockReturnValue(mockTripQueryChain);
      DriveSession.find.mockReturnValue(mockSessionQueryChain);
      
      await getRecentDriveSessions(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ owner_id: 'owner123' });
      expect(mockTripQueryChain.select).toHaveBeenCalledWith('_id');
      expect(DriveSession.find).toHaveBeenCalledWith({ 
        trip_id: { $in: ['trip1', 'trip2'] }
      });
      expect(mockSessionQueryChain.sort).toHaveBeenCalledWith({ start_time: -1 });
      expect(mockSessionQueryChain.limit).toHaveBeenCalledWith(5);
      expect(mockSessionQueryChain.populate).toHaveBeenCalledWith('trip_id');
      expect(res.json).toHaveBeenCalledWith(mockSessions);
    });

    it('should return recent drive sessions for driver role', async () => {
      const req = createMockReq({ 
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1' }
      ];
      
      const mockSessions = [
        { _id: 'session1', trip_id: 'trip1', start_time: new Date() }
      ];
      
      const mockTripQueryChain = {
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockImplementation((callback) => {
            callback(mockTrips);
            return { catch: jest.fn() };
          })
        })
      };
      
      const mockSessionQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          callback(mockSessions);
          return;
        })
      };
      
      Trip.find.mockReturnValue(mockTripQueryChain);
      DriveSession.find.mockReturnValue(mockSessionQueryChain);
      
      await getRecentDriveSessions(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({ driver_id: 'driver123' });
      expect(DriveSession.find).toHaveBeenCalledWith({ 
        trip_id: { $in: ['trip1'] }
      });
      expect(res.json).toHaveBeenCalledWith(mockSessions);
    });

    it('should return recent drive sessions for admin role', async () => {
      const req = createMockReq({ 
        user: { _id: 'admin123', role: 'admin' }
      });
      const res = createMockRes();
      
      const mockTrips = [
        { _id: 'trip1' },
        { _id: 'trip2' },
        { _id: 'trip3' }
      ];
      
      const mockSessions = [
        { _id: 'session1', trip_id: 'trip1', start_time: new Date() },
        { _id: 'session2', trip_id: 'trip2', start_time: new Date() }
      ];
      
      const mockTripQueryChain = {
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockImplementation((callback) => {
            callback(mockTrips);
            return { catch: jest.fn() };
          })
        })
      };
      
      const mockSessionQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          callback(mockSessions);
          return;
        })
      };
      
      Trip.find.mockReturnValue(mockTripQueryChain);
      DriveSession.find.mockReturnValue(mockSessionQueryChain);
      
      await getRecentDriveSessions(req, res);
      
      expect(Trip.find).toHaveBeenCalledWith({});
      expect(DriveSession.find).toHaveBeenCalledWith({ 
        trip_id: { $in: ['trip1', 'trip2', 'trip3'] }
      });
      expect(res.json).toHaveBeenCalledWith(mockSessions);
    });

    it('should handle server error', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      const mockTripQueryChain = {
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockReturnValue({
            catch: jest.fn().mockImplementation((callback) => {
              callback();
              return;
            })
          })
        })
      };
      
      Trip.find.mockReturnValue(mockTripQueryChain);
      
      await getRecentDriveSessions(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });

    it('should handle empty trips array', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      const mockTripQueryChain = {
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockImplementation((callback) => {
            callback([]); // Empty trips array
            return { catch: jest.fn() };
          })
        })
      };
      
      const mockSessionQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          callback([]); // Empty sessions array
          return;
        })
      };
      
      Trip.find.mockReturnValue(mockTripQueryChain);
      DriveSession.find.mockReturnValue(mockSessionQueryChain);
      
      await getRecentDriveSessions(req, res);
      
      expect(DriveSession.find).toHaveBeenCalledWith({ 
        trip_id: { $in: [] }
      });
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});
