import { jest } from '@jest/globals';

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

// Mock models
jest.unstable_mockModule('../models/truck.js', () => {
  const mockTruckConstructor = jest.fn().mockImplementation(() => ({
    save: jest.fn()
  }));
  
  // Add static methods
  mockTruckConstructor.find = jest.fn();
  mockTruckConstructor.findById = jest.fn();
  mockTruckConstructor.findByIdAndUpdate = jest.fn();
  mockTruckConstructor.findByIdAndDelete = jest.fn();
  
  return {
    Truck: mockTruckConstructor
  };
});

// Mock validation models
jest.unstable_mockModule('../validationModels/validateTruck.js', () => ({
  validateTruck: jest.fn()
}));

// Import mocked modules
let mongoose;
let Truck;
let validateTruck;

// Import controller functions
let createTruck, getAllTrucks, getTruckById, updateTruck, deleteTruck;

beforeAll(async () => {
  // Import mocked modules
  mongoose = await import('mongoose');
  const truckModule = await import('../models/truck.js');
  const validateTruckModule = await import('../validationModels/validateTruck.js');
  
  Truck = truckModule.Truck;
  validateTruck = validateTruckModule.validateTruck;
  
  // Import controller functions
  const controllerModule = await import('../controllers/truckController.js');
  createTruck = controllerModule.createTruck;
  getAllTrucks = controllerModule.getAllTrucks;
  getTruckById = controllerModule.getTruckById;
  updateTruck = controllerModule.updateTruck;
  deleteTruck = controllerModule.deleteTruck;
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
  user: {},
  ...overrides,
});

describe('Truck Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mongoose mock
    mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
  });

  describe('createTruck', () => {
    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ 
        body: { 
          plate_number: 'ABC123',
          condition: 'good',
          mileage_factor: 1.0
        },
        user: { _id: 'owner123' }
      });
      const res = createMockRes();
      
      validateTruck.mockReturnValue({ 
        error: { details: [{ message: 'Invalid plate number format' }] } 
      });
      
      await createTruck(req, res);
      
      expect(validateTruck).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid plate number format');
    });

    it('should create truck and return 201 on successful creation', async () => {
      const req = createMockReq({ 
        body: { 
          plate_number: 'ABC123',
          condition: 'good',
          mileage_factor: 1.0
        },
        user: { _id: 'owner123' }
      });
      const res = createMockRes();
      
      validateTruck.mockReturnValue({ error: null });
      
      const mockTruck = {
        _id: 'truck123',
        plate_number: 'ABC123',
        condition: 'good',
        mileage_factor: 1.0,
        owner_id: 'owner123'
      };
      
      const mockTruckInstance = {
        ...mockTruck,
        save: jest.fn().mockResolvedValue(mockTruck)
      };
      Truck.mockImplementation(() => mockTruckInstance);
      
      await createTruck(req, res);
      
      expect(Truck).toHaveBeenCalledWith({
        plate_number: 'ABC123',
        condition: 'good',
        mileage_factor: 1.0,
        owner_id: 'owner123'
      });
      expect(mockTruckInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(mockTruckInstance);
    });

    it('should handle server error during creation', async () => {
      const req = createMockReq({ 
        body: { 
          plate_number: 'ABC123',
          condition: 'good',
          mileage_factor: 1.0
        },
        user: { _id: 'owner123' }
      });
      const res = createMockRes();
      
      validateTruck.mockReturnValue({ error: null });
      
      const mockTruckInstance = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Truck.mockImplementation(() => mockTruckInstance);
      
      await createTruck(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getAllTrucks', () => {
    it('should return trucks for owner role', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      const mockTrucks = [
        { _id: 'truck1', plate_number: 'ABC123', owner_id: 'owner123' },
        { _id: 'truck2', plate_number: 'DEF456', owner_id: 'owner123' }
      ];
      
      Truck.find.mockResolvedValue(mockTrucks);
      
      await getAllTrucks(req, res);
      
      expect(Truck.find).toHaveBeenCalledWith({ owner_id: 'owner123' });
      expect(res.send).toHaveBeenCalledWith(mockTrucks);
    });

    it('should return all trucks for admin role', async () => {
      const req = createMockReq({ 
        user: { _id: 'admin123', role: 'admin' }
      });
      const res = createMockRes();
      
      const mockTrucks = [
        { _id: 'truck1', plate_number: 'ABC123', owner_id: 'owner1' },
        { _id: 'truck2', plate_number: 'DEF456', owner_id: 'owner2' }
      ];
      
      Truck.find.mockResolvedValue(mockTrucks);
      
      await getAllTrucks(req, res);
      
      expect(Truck.find).toHaveBeenCalledWith({});
      expect(res.send).toHaveBeenCalledWith(mockTrucks);
    });

    it('should return 403 for driver role', async () => {
      const req = createMockReq({ 
        user: { _id: 'driver123', role: 'driver' }
      });
      const res = createMockRes();
      
      await getAllTrucks(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Drivers are not permitted to view truck list.' 
      });
    });

    it('should return 403 for unauthorized role', async () => {
      const req = createMockReq({ 
        user: { _id: 'user123', role: 'unknown' }
      });
      const res = createMockRes();
      
      await getAllTrucks(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Unauthorized role' 
      });
    });

    it('should handle server error', async () => {
      const req = createMockReq({ 
        user: { _id: 'owner123', role: 'owner' }
      });
      const res = createMockRes();
      
      Truck.find.mockRejectedValue(new Error('Database error'));
      
      await getAllTrucks(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getTruckById', () => {
    it('should return 400 if truck ID is missing', async () => {
      const req = createMockReq({ params: {} });
      const res = createMockRes();
      
      await getTruckById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid or missing truck ID');
    });

    it('should return 400 if truck ID is invalid', async () => {
      const req = createMockReq({ params: { id: 'invalid-id' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(false);
      
      await getTruckById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid or missing truck ID');
    });

    it('should return 404 if truck not found', async () => {
      const req = createMockReq({ params: { id: 'valid123' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      Truck.findById.mockResolvedValue(null);
      
      await getTruckById(req, res);
      
      expect(Truck.findById).toHaveBeenCalledWith('valid123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Truck not found');
    });

    it('should return truck if found', async () => {
      const req = createMockReq({ params: { id: 'valid123' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      
      const mockTruck = {
        _id: 'valid123',
        plate_number: 'ABC123',
        condition: 'good',
        mileage_factor: 1.0
      };
      
      Truck.findById.mockResolvedValue(mockTruck);
      
      await getTruckById(req, res);
      
      expect(Truck.findById).toHaveBeenCalledWith('valid123');
      expect(res.send).toHaveBeenCalledWith(mockTruck);
    });

    it('should handle server error', async () => {
      const req = createMockReq({ params: { id: 'valid123' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      Truck.findById.mockRejectedValue(new Error('Database error'));
      
      await getTruckById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('updateTruck', () => {
    it('should return 400 if truck ID is missing', async () => {
      const req = createMockReq({ 
        params: {},
        body: { plate_number: 'ABC123' }
      });
      const res = createMockRes();
      
      await updateTruck(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid or missing truck ID');
    });

    it('should return 400 if truck ID is invalid', async () => {
      const req = createMockReq({ 
        params: { id: 'invalid-id' },
        body: { plate_number: 'ABC123' }
      });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(false);
      
      await updateTruck(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid or missing truck ID');
    });

    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ 
        params: { id: 'valid123' },
        body: { plate_number: 'ABC123' }
      });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      validateTruck.mockReturnValue({ 
        error: { details: [{ message: 'Invalid plate number format' }] } 
      });
      
      await updateTruck(req, res);
      
      expect(validateTruck).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid plate number format');
    });

    it('should return 404 if truck not found', async () => {
      const req = createMockReq({ 
        params: { id: 'valid123' },
        body: { 
          plate_number: 'ABC123',
          condition: 'good',
          mileage_factor: 1.0
        }
      });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      validateTruck.mockReturnValue({ error: null });
      Truck.findByIdAndUpdate.mockResolvedValue(null);
      
      await updateTruck(req, res);
      
      expect(Truck.findByIdAndUpdate).toHaveBeenCalledWith(
        'valid123',
        {
          plate_number: 'ABC123',
          condition: 'good',
          mileage_factor: 1.0
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Truck not found');
    });

    it('should update truck and return updated truck', async () => {
      const req = createMockReq({ 
        params: { id: 'valid123' },
        body: { 
          plate_number: 'XYZ789',
          condition: 'excellent',
          mileage_factor: 1.2
        }
      });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      validateTruck.mockReturnValue({ error: null });
      
      const updatedTruck = {
        _id: 'valid123',
        plate_number: 'XYZ789',
        condition: 'excellent',
        mileage_factor: 1.2
      };
      
      Truck.findByIdAndUpdate.mockResolvedValue(updatedTruck);
      
      await updateTruck(req, res);
      
      expect(Truck.findByIdAndUpdate).toHaveBeenCalledWith(
        'valid123',
        {
          plate_number: 'XYZ789',
          condition: 'excellent',
          mileage_factor: 1.2
        },
        { new: true }
      );
      expect(res.send).toHaveBeenCalledWith(updatedTruck);
    });

    it('should handle server error during update', async () => {
      const req = createMockReq({ 
        params: { id: 'valid123' },
        body: { plate_number: 'ABC123' }
      });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      validateTruck.mockReturnValue({ error: null });
      Truck.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));
      
      await updateTruck(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('deleteTruck', () => {
    it('should return 400 if truck ID is missing', async () => {
      const req = createMockReq({ params: {} });
      const res = createMockRes();
      
      await deleteTruck(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid or missing truck ID');
    });

    it('should return 400 if truck ID is invalid', async () => {
      const req = createMockReq({ params: { id: 'invalid-id' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(false);
      
      await deleteTruck(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid or missing truck ID');
    });

    it('should return 404 if truck not found', async () => {
      const req = createMockReq({ params: { id: 'valid123' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      Truck.findByIdAndDelete.mockResolvedValue(null);
      
      await deleteTruck(req, res);
      
      expect(Truck.findByIdAndDelete).toHaveBeenCalledWith('valid123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Truck not found');
    });

    it('should delete truck and return success message', async () => {
      const req = createMockReq({ params: { id: 'valid123' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      
      const deletedTruck = {
        _id: 'valid123',
        plate_number: 'ABC123'
      };
      
      Truck.findByIdAndDelete.mockResolvedValue(deletedTruck);
      
      await deleteTruck(req, res);
      
      expect(Truck.findByIdAndDelete).toHaveBeenCalledWith('valid123');
      expect(res.send).toHaveBeenCalledWith({ message: 'Truck deleted successfully' });
    });

    it('should handle server error during deletion', async () => {
      const req = createMockReq({ params: { id: 'valid123' } });
      const res = createMockRes();
      
      mongoose.default.Types.ObjectId.isValid.mockReturnValue(true);
      Truck.findByIdAndDelete.mockRejectedValue(new Error('Database error'));
      
      await deleteTruck(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });
});
