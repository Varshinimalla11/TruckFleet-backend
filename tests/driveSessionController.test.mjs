import { jest } from '@jest/globals';

// Mock all dependencies
jest.unstable_mockModule('../models/driveSession.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../models/restLog.js', () => ({
  default: jest.fn().mockImplementation(function(data) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(true)
    };
  })
}));

jest.unstable_mockModule('../models/trip.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../models/truck.js', () => ({
  Truck: jest.fn()
}));

jest.unstable_mockModule('../models/refuelEvent.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../utils/notifyUser.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../models/notification.js', () => ({
  Notification: jest.fn()
}));

// Mock mongoose
jest.unstable_mockModule('mongoose', () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: jest.fn()
      }
    },
    Schema: jest.fn().mockReturnValue({
      Types: {
        ObjectId: jest.fn()
      }
    }),
    model: jest.fn()
  }
}));

// Utility functions
const createMockReq = (overrides = {}) => ({
  params: {},
  body: {},
  user: { _id: 'user123', role: 'driver' },
  ...overrides
});

const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis()
});

// Import mocked modules
let driveSessionModule, restLogModule, tripModule, truckModule, refuelEventModule, notifyUserModule;
let DriveSession, RestLog, Trip, Truck, RefuelEvent, notifyUser;
let endDriveSessionAndStartRest, getSessionsByTrip;

beforeAll(async () => {
  driveSessionModule = await import('../models/driveSession.js');
  restLogModule = await import('../models/restLog.js');
  tripModule = await import('../models/trip.js');
  truckModule = await import('../models/truck.js');
  refuelEventModule = await import('../models/refuelEvent.js');
  notifyUserModule = await import('../utils/notifyUser.js');
  
  DriveSession = driveSessionModule.default;
  RestLog = restLogModule.default;
  Trip = tripModule.default;
  Truck = truckModule.Truck;
  RefuelEvent = refuelEventModule.default;
  notifyUser = notifyUserModule.default;
});

beforeEach(async () => {
  const controller = await import('../controllers/driveSessionController.js');
  endDriveSessionAndStartRest = controller.endDriveSessionAndStartRest;
  getSessionsByTrip = controller.getSessionsByTrip;
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mocks
  DriveSession.findById = jest.fn();
  DriveSession.find = jest.fn();
  DriveSession.findOne = jest.fn();
  DriveSession.aggregate = jest.fn();
  RestLog.findOne = jest.fn();
  Trip.findById = jest.fn();
  Truck.findById = jest.fn();
  RefuelEvent.find = jest.fn();
  notifyUser.mockResolvedValue(undefined);
});

describe('DriveSession Controller', () => {
  describe('endDriveSessionAndStartRest', () => {
    it('should end drive session and start rest successfully', async () => {
      const mockSession = Object.create({});
      mockSession._id = 'session123';
      mockSession.trip_id = 'trip123';
      mockSession.start_time = new Date('2024-01-01T10:00:00Z');
      mockSession.end_time = null;
      mockSession.fuel_used = undefined;
      mockSession.km_covered = undefined;
      mockSession.fuel_left = undefined;
      mockSession.duration_hours = undefined;
      mockSession.save = jest.fn().mockResolvedValue(true);
      
      const mockTrip = {
        _id: 'trip123',
        fuel_start: 100,
        total_km: 500,
        driver_snapshot: { name: 'John Doe' },
        owner_id: 'owner123',
        truck_id: 'truck123'
      };
      
      const mockTruck = {
        _id: 'truck123',
        mileage_factor: 3
      };
      
      const mockRestLog = {
        _id: 'rest123',
        trip_id: 'trip123',
        rest_start_time: new Date(),
        fuel_at_rest_start: 75,
        save: jest.fn().mockResolvedValue(true)
      };
      
      DriveSession.findById.mockResolvedValue(mockSession);
      Trip.findById.mockResolvedValue(mockTrip);
      Truck.findById.mockResolvedValue(mockTruck);
      RestLog.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      });
      DriveSession.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      });
      RefuelEvent.find.mockResolvedValue([]);
      DriveSession.aggregate.mockResolvedValue([]);
      
      const req = createMockReq({
        params: { session_id: 'session123' },
        body: { fuel_left: 75 }
      });
      const res = createMockRes();
      
      console.log('Before controller call - mocks setup complete');
      
      await endDriveSessionAndStartRest(req, res);
      
      console.log('After controller call - checking results');
      
      // Debug: Check what was actually set on the session
      console.log('Session after controller execution:', {
        end_time: mockSession.end_time,
        fuel_used: mockSession.fuel_used,
        km_covered: mockSession.km_covered,
        fuel_left: mockSession.fuel_left,
        duration_hours: mockSession.duration_hours
      });
      
      // Debug: Check if save was called
      console.log('Save method called:', mockSession.save.mock.calls.length);
      
      // Debug: Check what mocks were called
      console.log('DriveSession.findById called:', DriveSession.findById.mock.calls.length);
      console.log('Trip.findById called:', Trip.findById.mock.calls.length);
      console.log('Truck.findById called:', Truck.findById.mock.calls.length);
      console.log('RestLog.findOne called:', RestLog.findOne.mock.calls.length);
      console.log('DriveSession.findOne called:', DriveSession.findOne.mock.calls.length);
      console.log('RefuelEvent.find called:', RefuelEvent.find.mock.calls.length);
      console.log('DriveSession.aggregate called:', DriveSession.aggregate.mock.calls.length);
      
      expect(DriveSession.findById).toHaveBeenCalledWith('session123');
      expect(mockSession.end_time).toBeInstanceOf(Date);
      expect(mockSession.duration_hours).toBeDefined();
      expect(mockSession.fuel_used).toBe(25); // 100 - 75
      expect(mockSession.km_covered).toBe(75); // 25 * 3
      expect(mockSession.fuel_left).toBe(75);
      expect(mockSession.save).toHaveBeenCalled();
      expect(RestLog).toHaveBeenCalledWith({
        trip_id: 'trip123',
        rest_start_time: expect.any(Date),
        fuel_at_rest_start: 75
      });
      
      // Debug: Check what was actually set on the session
      console.log('Session after controller execution:', {
        end_time: mockSession.end_time,
        fuel_used: mockSession.fuel_used,
        km_covered: mockSession.km_covered,
        fuel_left: mockSession.fuel_left,
        duration_hours: mockSession.duration_hours
      });
      expect(notifyUser).toHaveBeenCalledWith('user123', expect.stringContaining('🛑 Your drive session ended'));
      expect(notifyUser).toHaveBeenCalledWith('owner123', expect.stringContaining('📢 Driver John Doe ended driving'));
      expect(res.send).toHaveBeenCalledWith({
        message: 'Drive session ended and rest started',
        fuel_used: 25,
        km_covered: 75,
        remaining_km_in_trip: 425,
        session: mockSession,
        restLog: expect.objectContaining({
          trip_id: 'trip123',
          fuel_at_rest_start: 75
        })
      });
    });
    
    it('should handle missing drive session', async () => {
      DriveSession.findById.mockResolvedValue(null);
      
      const req = createMockReq({
        params: { session_id: 'invalid123' }
      });
      const res = createMockRes();
      
      await endDriveSessionAndStartRest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Drive session not found');
    });
    
    it('should handle already ended session', async () => {
      const mockSession = {
        _id: 'session123',
        end_time: new Date()
      };
      
      DriveSession.findById.mockResolvedValue(mockSession);
      
      const req = createMockReq({
        params: { session_id: 'session123' }
      });
      const res = createMockRes();
      
      await endDriveSessionAndStartRest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Session already ended');
    });
    
    it('should handle server errors', async () => {
      DriveSession.findById.mockRejectedValue(new Error('Database error'));
      
      const req = createMockReq({
        params: { session_id: 'session123' }
      });
      const res = createMockRes();
      
      await endDriveSessionAndStartRest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });
  
  describe('getSessionsByTrip', () => {
    it('should get drive sessions by trip successfully', async () => {
      const mockTrip = {
        _id: 'trip123',
        driver_id: 'driver123'
      };
      
      const mockSessions = [
        { _id: 'session1', trip_id: 'trip123', start_time: new Date() },
        { _id: 'session2', trip_id: 'trip123', start_time: new Date() }
      ];
      
      Trip.findById.mockResolvedValue(mockTrip);
      DriveSession.find.mockResolvedValue(mockSessions);
      
      const req = createMockReq({
        params: { tripId: 'trip123' },
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      await getSessionsByTrip(req, res);
      
      expect(Trip.findById).toHaveBeenCalledWith('trip123');
      expect(DriveSession.find).toHaveBeenCalledWith({ trip_id: 'trip123' });
      expect(res.send).toHaveBeenCalledWith(mockSessions);
    });
    
    it('should handle missing trip', async () => {
      Trip.findById.mockResolvedValue(null);
      
      const req = createMockReq({
        params: { tripId: 'invalid123' }
      });
      const res = createMockRes();
      
      await getSessionsByTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });
    
    it('should handle access denied for driver', async () => {
      const mockTrip = {
        _id: 'trip123',
        driver_id: 'driver456'
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      const req = createMockReq({
        params: { tripId: 'trip123' },
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      await getSessionsByTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Access denied');
    });
    
    it('should allow access for non-driver users', async () => {
      const mockTrip = {
        _id: 'trip123',
        driver_id: 'driver456'
      };
      
      const mockSessions = [
        { _id: 'session1', trip_id: 'trip123', start_time: new Date() }
      ];
      
      Trip.findById.mockResolvedValue(mockTrip);
      DriveSession.find.mockResolvedValue(mockSessions);
      
      const req = createMockReq({
        params: { tripId: 'trip123' },
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      await getSessionsByTrip(req, res);
      
      expect(DriveSession.find).toHaveBeenCalledWith({ trip_id: 'trip123' });
      expect(res.send).toHaveBeenCalledWith(mockSessions);
    });
  });
});
