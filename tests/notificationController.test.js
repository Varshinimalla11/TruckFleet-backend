const { Notification } = require('../models/notification');
const notificationController = require('../controllers/notificationController');

jest.mock('../models/notification');

describe('notificationController', () => {
  let req, res;
  beforeEach(() => {
    req = {
      user: { _id: 'user123' },
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('getMyNotifications', () => {
    it('should return notifications for user', async () => {
      const notifications = [{ _id: 'n1' }, { _id: 'n2' }];
      Notification.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(notifications) });
      await notificationController.getMyNotifications(req, res);
      expect(res.json).toHaveBeenCalledWith(notifications);
    });

    it('should handle errors and return 500', async () => {
      Notification.find.mockImplementation(() => { throw new Error('DB error'); });
      await notificationController.getMyNotifications(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith('Internal Server Error');
    });
  });

  describe('markAsSeen', () => {
    it('should mark notification as seen', async () => {
      req.params.id = 'n1';
      const notification = { _id: 'n1', seen: true };
      Notification.findOneAndUpdate.mockResolvedValue(notification);
      await notificationController.markAsSeen(req, res);
      expect(res.json).toHaveBeenCalledWith(notification);
    });

    it('should return 404 if notification not found', async () => {
      req.params.id = 'n1';
      Notification.findOneAndUpdate.mockResolvedValue(null);
      await notificationController.markAsSeen(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
    });

    it('should handle errors and return 500', async () => {
      req.params.id = 'n1';
      Notification.findOneAndUpdate.mockRejectedValue(new Error('DB error'));
      await notificationController.markAsSeen(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('markAllAsSeen', () => {
    it('should mark all notifications as seen', async () => {
      Notification.updateMany.mockResolvedValue({});
      await notificationController.markAllAsSeen(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'All notifications marked as seen' });
    });

    it('should handle errors and return 500', async () => {
      Notification.updateMany.mockRejectedValue(new Error('DB error'));
      await notificationController.markAllAsSeen(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification and return success', async () => {
      req.params.id = 'n1';
      Notification.findOneAndDelete.mockResolvedValue({ _id: 'n1' });
      await notificationController.deleteNotification(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 404 if notification not found', async () => {
      req.params.id = 'n1';
      Notification.findOneAndDelete.mockResolvedValue(null);
      await notificationController.deleteNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
    });

    it('should handle errors and return 500', async () => {
      req.params.id = 'n1';
      Notification.findOneAndDelete.mockRejectedValue(new Error('DB error'));
      await notificationController.deleteNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });
});
