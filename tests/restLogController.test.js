const RestLog = require('../models/restLog');
const DriveSession = require('../models/driveSession');
const Trip = require('../models/trip');
const notifyUser = require('../utils/notifyUser');
const restLogController = require('../controllers/restLogController');

jest.mock('../models/restLog');
jest.mock('../models/driveSession');
jest.mock('../models/trip');
jest.mock('../utils/notifyUser');

describe('restLogController', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { _id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('endRestAndStartDrive', () => {
    it('should return 404 if rest log not found', async () => {
      req.params.rest_id = 'rest1';
      RestLog.findById.mockResolvedValue(null);
      await restLogController.endRestAndStartDrive(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Rest log not found' });
    });

    it('should end rest, start drive, and notify users', async () => {
      req.params.rest_id = 'rest1';
      req.body = { fuel_at_rest_end: 80 };
      const restLog = {
        _id: 'rest1',
        trip_id: 'trip1',
        rest_end_time: null,
        fuel_at_rest_end: 70,
        save: jest.fn().mockResolvedValue(true),
      };
      RestLog.findById.mockResolvedValue(restLog);
      const newDriveSession = { _id: 'ds1', trip_id: 'trip1', start_time: new Date() };
      DriveSession.create.mockResolvedValue(newDriveSession);
      notifyUser.mockResolvedValue();
      const trip = {
        owner_id: 'owner123',
        driver_snapshot: { name: 'Test Driver' },
      };
      Trip.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(trip) });
      await restLogController.endRestAndStartDrive(req, res);
      expect(restLog.save).toHaveBeenCalled();
      expect(DriveSession.create).toHaveBeenCalledWith({ trip_id: 'trip1', start_time: expect.any(Date) });
      expect(notifyUser).toHaveBeenCalledWith('user123', expect.stringContaining('Rest ended. Drive session resumed.'));
      expect(notifyUser).toHaveBeenCalledWith('owner123', expect.stringContaining('has resumed driving after a rest'));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Rest ended and drive resumed', restLog, newDriveSession }));
    });

    it('should handle errors and return 500', async () => {
      req.params.rest_id = 'rest1';
      RestLog.findById.mockRejectedValue(new Error('DB error'));
      await restLogController.endRestAndStartDrive(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('getRestLogsByTrip', () => {
    it('should return rest logs for a trip', async () => {
      req.params.tripId = 'trip1';
      const logs = [{ _id: 'rest1' }, { _id: 'rest2' }];
      RestLog.find.mockResolvedValue(logs);
      await restLogController.getRestLogsByTrip(req, res);
      expect(RestLog.find).toHaveBeenCalledWith({ trip_id: 'trip1' });
      expect(res.json).toHaveBeenCalledWith(logs);
    });

    it('should handle errors and return 500', async () => {
      req.params.tripId = 'trip1';
      RestLog.find.mockRejectedValue(new Error('DB error'));
      await restLogController.getRestLogsByTrip(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
