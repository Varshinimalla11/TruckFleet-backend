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
jest.unstable_mockModule('../models/notification.js', () => ({
  Notification: {
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    updateMany: jest.fn()
  }
}));

let getMyNotifications, markAsSeen, markAllAsSeen, deleteNotification;
let Notification;

beforeAll(async () => {
  // Import mocked models
  const notificationModule = await import('../models/notification.js');
  Notification = notificationModule.Notification;
  
  // Import controller functions
  const controllerModule = await import('../controllers/notificationController.js');
  getMyNotifications = controllerModule.getMyNotifications;
  markAsSeen = controllerModule.markAsSeen;
  markAllAsSeen = controllerModule.markAllAsSeen;
  deleteNotification = controllerModule.deleteNotification;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Notification Controller', () => {
  describe('getMyNotifications', () => {
    it('should get notifications for user', async () => {
      const req = createMockReq({ user: { _id: 'user123' } });
      const res = createMockRes();
      
      const mockNotifications = [
        { _id: 'notif1', message: 'Test notification 1', seen: false },
        { _id: 'notif2', message: 'Test notification 2', seen: true }
      ];
      
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockNotifications)
        })
      });
      
      await getMyNotifications(req, res);
      
      expect(Notification.find).toHaveBeenCalledWith({ user_id: 'user123' });
      expect(res.json).toHaveBeenCalledWith(mockNotifications);
    });

    it('should handle server error', async () => {
      const req = createMockReq({ user: { _id: 'user123' } });
      const res = createMockRes();
      
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });
      
      await getMyNotifications(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith('Internal Server Error');
    });
  });

  describe('markAsSeen', () => {
    it('should mark notification as seen', async () => {
      const req = createMockReq({ 
        params: { id: 'notif123' },
        user: { _id: 'user123' }
      });
      const res = createMockRes();
      
      const mockNotification = {
        _id: 'notif123',
        user_id: 'user123',
        seen: true
      };
      
      Notification.findOneAndUpdate.mockResolvedValue(mockNotification);
      
      await markAsSeen(req, res);
      
      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'notif123', user_id: 'user123' },
        { seen: true },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(mockNotification);
    });

    it('should return 404 if notification not found', async () => {
      const req = createMockReq({ 
        params: { id: 'nonexistent' },
        user: { _id: 'user123' }
      });
      const res = createMockRes();
      
      Notification.findOneAndUpdate.mockResolvedValue(null);
      
      await markAsSeen(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
    });

    it('should handle server error', async () => {
      const req = createMockReq({ 
        params: { id: 'notif123' },
        user: { _id: 'user123' }
      });
      const res = createMockRes();
      
      Notification.findOneAndUpdate.mockRejectedValue(new Error('Database error'));
      
      await markAsSeen(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('markAllAsSeen', () => {
    it('should mark all notifications as seen', async () => {
      const req = createMockReq({ user: { _id: 'user123' } });
      const res = createMockRes();
      
      Notification.updateMany.mockResolvedValue({ modifiedCount: 5 });
      
      await markAllAsSeen(req, res);
      
      expect(Notification.updateMany).toHaveBeenCalledWith(
        { user_id: 'user123', seen: false },
        { seen: true }
      );
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'All notifications marked as seen' 
      });
    });

    it('should handle server error', async () => {
      const req = createMockReq({ user: { _id: 'user123' } });
      const res = createMockRes();
      
      Notification.updateMany.mockRejectedValue(new Error('Database error'));
      
      await markAllAsSeen(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const req = createMockReq({ 
        params: { id: 'notif123' },
        user: { _id: 'user123' }
      });
      const res = createMockRes();
      
      const mockNotification = {
        _id: 'notif123',
        user_id: 'user123',
        message: 'Test notification'
      };
      
      Notification.findOneAndDelete.mockResolvedValue(mockNotification);
      
      await deleteNotification(req, res);
      
      expect(Notification.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'notif123',
        user_id: 'user123'
      });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 404 if notification not found', async () => {
      const req = createMockReq({ 
        params: { id: 'nonexistent' },
        user: { _id: 'user123' }
      });
      const res = createMockRes();
      
      Notification.findOneAndDelete.mockResolvedValue(null);
      
      await deleteNotification(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
    });

    it('should handle server error', async () => {
      const req = createMockReq({ 
        params: { id: 'notif123' },
        user: { _id: 'user123' }
      });
      const res = createMockRes();
      
      Notification.findOneAndDelete.mockRejectedValue(new Error('Database error'));
      
      await deleteNotification(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });
});
