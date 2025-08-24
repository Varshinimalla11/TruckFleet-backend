import { jest } from '@jest/globals';

// Mock all dependencies
jest.unstable_mockModule('../models/restLog.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../models/trip.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../models/driveSession.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../utils/notifyUser.js', () => ({
  default: jest.fn()
}));

// Mock mongoose
jest.unstable_mockModule('mongoose', () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: jest.fn()
      }
    }
  }
}));

// Utility functions
const createMockReq = (overrides = {}) => ({
  params: {},
  body: {},
  user: { _id: 'user123' },
  ...overrides
});

const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis()
});

// Import mocked modules
let restLogModule, tripModule, driveSessionModule, notifyUserModule;
let RestLog, Trip, DriveSession, notifyUser;
let endRestAndStartDrive, getRestLogsByTrip;

beforeAll(async () => {
  restLogModule = await import('../models/restLog.js');
  tripModule = await import('../models/trip.js');
  driveSessionModule = await import('../models/driveSession.js');
  notifyUserModule = await import('../utils/notifyUser.js');
  
  RestLog = restLogModule.default;
  Trip = tripModule.default;
  DriveSession = driveSessionModule.default;
  notifyUser = notifyUserModule.default;
});

beforeEach(async () => {
  const controller = await import('../controllers/restLogController.js');
  endRestAndStartDrive = controller.endRestAndStartDrive;
  getRestLogsByTrip = controller.getRestLogsByTrip;
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mocks
  RestLog.findById = jest.fn();
  RestLog.find = jest.fn();
  Trip.findById = jest.fn();
  DriveSession.create = jest.fn();
  notifyUser.mockResolvedValue(undefined);
});

describe('RestLog Controller', () => {
  describe('endRestAndStartDrive', () => {
    it('should end rest and start drive session successfully', async () => {
      const mockRestLog = {
        _id: 'rest123',
        trip_id: 'trip123',
        rest_end_time: null,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockTrip = {
        _id: 'trip123',
        owner_id: 'owner123',
        driver_snapshot: { name: 'John Doe' }
      };
      
      const mockDriveSession = {
        _id: 'session123',
        trip_id: 'trip123',
        start_time: new Date()
      };
      
      RestLog.findById.mockResolvedValue(mockRestLog);
      Trip.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTrip)
      });
      DriveSession.create.mockResolvedValue(mockDriveSession);
      
      const req = createMockReq({
        params: { rest_id: 'rest123' },
        body: { fuel_at_rest_end: 75 }
      });
      const res = createMockRes();
      
      await endRestAndStartDrive(req, res);
      
      expect(RestLog.findById).toHaveBeenCalledWith('rest123');
      expect(mockRestLog.rest_end_time).toBeInstanceOf(Date);
      expect(mockRestLog.fuel_at_rest_end).toBe(75);
      expect(mockRestLog.save).toHaveBeenCalled();
      expect(DriveSession.create).toHaveBeenCalledWith({
        trip_id: 'trip123',
        start_time: expect.any(Date)
      });
      expect(notifyUser).toHaveBeenCalledWith('user123', '🟢 Rest ended. Drive session resumed.');
      expect(notifyUser).toHaveBeenCalledWith('owner123', '📢 Driver John Doe has resumed driving after a rest.');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rest ended and drive resumed',
        restLog: mockRestLog,
        newDriveSession: mockDriveSession
      });
    });
    
    it('should handle missing rest log', async () => {
      RestLog.findById.mockResolvedValue(null);
      
      const req = createMockReq({
        params: { rest_id: 'invalid123' }
      });
      const res = createMockRes();
      
      await endRestAndStartDrive(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rest log not found'
      });
    });
    
    it('should handle missing fuel_at_rest_end in body', async () => {
      const mockRestLog = {
        _id: 'rest123',
        trip_id: 'trip123',
        rest_end_time: null,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockTrip = {
        _id: 'trip123',
        owner_id: 'owner123',
        driver_snapshot: { name: 'John Doe' }
      };
      
      const mockDriveSession = {
        _id: 'session123',
        trip_id: 'trip123',
        start_time: new Date()
      };
      
      RestLog.findById.mockResolvedValue(mockRestLog);
      Trip.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTrip)
      });
      DriveSession.create.mockResolvedValue(mockDriveSession);
      
      const req = createMockReq({
        params: { rest_id: 'rest123' },
        body: {}
      });
      const res = createMockRes();
      
      await endRestAndStartDrive(req, res);
      
      expect(mockRestLog.fuel_at_rest_end).toBeUndefined();
      expect(mockRestLog.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rest ended and drive resumed',
        restLog: mockRestLog,
        newDriveSession: mockDriveSession
      });
    });
    
    it('should handle server errors', async () => {
      RestLog.findById.mockRejectedValue(new Error('Database error'));
      
      const req = createMockReq({
        params: { rest_id: 'rest123' }
      });
      const res = createMockRes();
      
      await endRestAndStartDrive(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });
  
  describe('getRestLogsByTrip', () => {
    it('should get rest logs by trip successfully', async () => {
      const mockRestLogs = [
        { _id: 'rest1', trip_id: 'trip123', rest_start_time: new Date() },
        { _id: 'rest2', trip_id: 'trip123', rest_start_time: new Date() }
      ];
      
      RestLog.find.mockResolvedValue(mockRestLogs);
      
      const req = createMockReq({
        params: { tripId: 'trip123' }
      });
      const res = createMockRes();
      
      await getRestLogsByTrip(req, res);
      
      expect(RestLog.find).toHaveBeenCalledWith({ trip_id: 'trip123' });
      expect(res.json).toHaveBeenCalledWith(mockRestLogs);
    });
    
    it('should handle server errors', async () => {
      RestLog.find.mockRejectedValue(new Error('Database error'));
      
      const req = createMockReq({
        params: { tripId: 'trip123' }
      });
      const res = createMockRes();
      
      await getRestLogsByTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });
});
