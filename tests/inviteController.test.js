const { InviteToken } = require('../models/inviteToken');
const sendEmail = require('../utils/emailService');
const inviteController = require('../controllers/inviteController');

jest.mock('../models/inviteToken');
jest.mock('../utils/emailService');

describe('inviteController', () => {
  let req, res;
  beforeEach(() => {
    req = {
      body: {},
      user: { _id: 'owner123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('sendInviteToken', () => {
    it('should return 400 if email is missing', async () => {
      req.body = {};
      await inviteController.sendInviteToken(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Driver email is required.');
    });

    it('should send invite and email successfully', async () => {
      req.body = { email: 'driver@example.com' };
      const mockSave = jest.fn().mockResolvedValue(true);
      InviteToken.mockImplementation(() => ({ save: mockSave }));
      sendEmail.mockResolvedValue(true);
      await inviteController.sendInviteToken(req, res);
      expect(mockSave).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith(
        'driver@example.com',
        expect.stringContaining('Driver Registration Invite'),
        expect.stringContaining('http://localhost:3000/register-driver?token=')
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invite sent successfully', token: expect.any(String) })
      );
    });

    it('should handle errors and return 500', async () => {
      req.body = { email: 'driver@example.com' };
      InviteToken.mockImplementation(() => ({ save: jest.fn().mockRejectedValue(new Error('DB error')) }));
      await inviteController.sendInviteToken(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to send invite', error: 'DB error' })
      );
    });
  });

  describe('verifyInviteToken', () => {
    it('should return 400 if token is missing', async () => {
      req.body = {};
      await inviteController.verifyInviteToken(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Token is required' });
    });

    it('should return 400 if token is invalid or expired', async () => {
      req.body = { token: 'abc123' };
      InviteToken.findOne.mockResolvedValue(null);
      await inviteController.verifyInviteToken(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });

    it('should return 400 if token is expired', async () => {
      req.body = { token: 'abc123' };
      InviteToken.findOne.mockResolvedValue({ expiresAt: Date.now() - 1000 });
      await inviteController.verifyInviteToken(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });

    it('should verify valid token and return email', async () => {
      req.body = { token: 'abc123' };
      InviteToken.findOne.mockResolvedValue({ expiresAt: Date.now() + 10000, email: 'driver@example.com' });
      await inviteController.verifyInviteToken(req, res);
      expect(res.send).toHaveBeenCalledWith({ valid: true, email: 'driver@example.com' });
    });

    it('should handle server error and return 500', async () => {
      req.body = { token: 'abc123' };
      InviteToken.findOne.mockRejectedValue(new Error('DB error'));
      await inviteController.verifyInviteToken(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
