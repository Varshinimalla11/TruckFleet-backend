import { jest } from '@jest/globals';

// Mock utility functions
const createMockReq = (data = {}) => ({
  body: {},
  query: {},
  params: {},
  user: {},
  ...data
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock models
jest.unstable_mockModule('../models/refuelEvent.js', () => {
  const mockRefuelEventConstructor = jest.fn().mockImplementation((data) => {
    const refuelEventInstance = {
      ...data,
      save: jest.fn().mockResolvedValue(refuelEventInstance)
    };
    return refuelEventInstance;
  });
  
  // Add static methods
  mockRefuelEventConstructor.find = jest.fn();
  mockRefuelEventConstructor.findById = jest.fn();
  mockRefuelEventConstructor.create = jest.fn();
  mockRefuelEventConstructor.findByIdAndUpdate = jest.fn();
  mockRefuelEventConstructor.findByIdAndDelete = jest.fn();
  
  return {
    default: mockRefuelEventConstructor
  };
});

jest.unstable_mockModule('../models/trip.js', () => ({
  default: {
    findById: jest.fn()
  }
}));

jest.unstable_mockModule('../utils/notifyUser.js', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../validationModels/validateRefuel.js', () => ({
  default: {
    validateRefuelEvent: jest.fn()
  }
}));

let logRefuel, getRefuelLogsByTrip;
let RefuelEvent, Trip, notifyUser, refuelValidation;

beforeAll(async () => {
  // Import mocked models
  const refuelEventModule = await import('../models/refuelEvent.js');
  const tripModule = await import('../models/trip.js');
  
  RefuelEvent = refuelEventModule.default;
  Trip = tripModule.default;
  
  // Import mocked utilities
  const notifyUserModule = await import('../utils/notifyUser.js');
  notifyUser = notifyUserModule.default;
  
  // Import mocked validation
  const refuelValidationModule = await import('../validationModels/validateRefuel.js');
  refuelValidation = refuelValidationModule.default;
  
  // Import controller functions
  const controllerModule = await import('../controllers/refuelEventController.js');
  logRefuel = controllerModule.logRefuel;
  getRefuelLogsByTrip = controllerModule.getRefuelLogsByTrip;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RefuelEvent Controller', () => {
  describe('logRefuel', () => {
    it('should log a refuel event successfully', async () => {
      const req = createMockReq({ 
        body: { 
          trip_id: 'trip123', 
          event_time: new Date(),
          fuel_before: 50,
          fuel_added: 100,
          payment_mode: 'card'
        },
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        driver_id: 'driver123',
        owner_id: 'owner123',
        driver_snapshot: { name: 'John Doe' }
      };
      Trip.findById.mockResolvedValue(mockTrip);
      
      refuelValidation.validateRefuelEvent.mockReturnValue({ error: null });
      
      const mockRefuelEvent = {
        _id: 'refuel123',
        trip_id: 'trip123',
        event_time: req.body.event_time,
        fuel_before: 50,
        fuel_added: 100,
        fuel_after: 150,
        payment_mode: 'card',
        save: jest.fn().mockResolvedValue()
      };
      
      // Mock RefuelEvent constructor
      RefuelEvent.mockImplementation(() => mockRefuelEvent);
      
      await logRefuel(req, res);
      
      expect(Trip.findById).toHaveBeenCalledWith('trip123');
      expect(RefuelEvent).toHaveBeenCalledWith({
        trip_id: 'trip123',
        event_time: req.body.event_time,
        fuel_before: 50,
        fuel_added: 100,
        fuel_after: 150,
        payment_mode: 'card'
      });
      expect(mockRefuelEvent.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ 
        message: 'Refuel event logged', 
        refuelEvent: mockRefuelEvent 
      });
    });

    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ 
        body: { trip_id: 'trip123' } 
      });
      const res = createMockRes();
      
      refuelValidation.validateRefuelEvent.mockReturnValue({ 
        error: { details: [{ message: 'Validation failed' }] } 
      });
      
      await logRefuel(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Validation failed');
    });

    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ 
        body: { 
          trip_id: 'nonexistent',
          event_time: new Date(),
          fuel_before: 50,
          fuel_added: 100
        } 
      });
      const res = createMockRes();
      
      refuelValidation.validateRefuelEvent.mockReturnValue({ error: null });
      Trip.findById.mockResolvedValue(null);
      
      await logRefuel(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should return 403 if driver access denied', async () => {
      const req = createMockReq({ 
        body: { 
          trip_id: 'trip123',
          event_time: new Date(),
          fuel_before: 50,
          fuel_added: 100
        },
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        driver_id: 'different-driver',
        owner_id: 'owner123'
      };
      
      refuelValidation.validateRefuelEvent.mockReturnValue({ error: null });
      Trip.findById.mockResolvedValue(mockTrip);
      
      await logRefuel(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Access denied');
    });
  });

  describe('getRefuelLogsByTrip', () => {
    it('should return refuel logs for a trip', async () => {
      const req = createMockReq({ 
        params: { tripId: 'trip123' },
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        driver_id: 'driver123',
        owner_id: 'owner123'
      };
      Trip.findById.mockResolvedValue(mockTrip);
      
      const mockRefuelLogs = [
        { _id: 'refuel1', trip_id: 'trip123', fuel_added: 100 },
        { _id: 'refuel2', trip_id: 'trip123', fuel_added: 80 }
      ];
      RefuelEvent.find.mockResolvedValue(mockRefuelLogs);
      
      await getRefuelLogsByTrip(req, res);
      
      expect(Trip.findById).toHaveBeenCalledWith('trip123');
      expect(RefuelEvent.find).toHaveBeenCalledWith({ trip_id: 'trip123' });
      expect(res.send).toHaveBeenCalledWith(mockRefuelLogs);
    });

    it('should return 404 if trip not found', async () => {
      const req = createMockReq({ 
        params: { tripId: 'nonexistent' } 
      });
      const res = createMockRes();
      
      Trip.findById.mockResolvedValue(null);
      
      await getRefuelLogsByTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Trip not found');
    });

    it('should return 403 if driver access denied', async () => {
      const req = createMockReq({ 
        params: { tripId: 'trip123' },
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      const mockTrip = {
        _id: 'trip123',
        driver_id: 'different-driver',
        owner_id: 'owner123'
      };
      
      Trip.findById.mockResolvedValue(mockTrip);
      
      await getRefuelLogsByTrip(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Access denied');
    });
  });
});
