import { jest } from '@jest/globals';

// Mock all dependencies
jest.unstable_mockModule('../models/inviteToken.js', () => ({
  InviteToken: jest.fn()
}));

jest.unstable_mockModule('../models/user.js', () => ({
  User: jest.fn()
}));

jest.unstable_mockModule('../utils/emailService.js', () => ({
  sendEmail: jest.fn()
}));

jest.unstable_mockModule('crypto', () => ({
  default: {
    randomBytes: jest.fn()
  }
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
let inviteTokenModule, userModule, emailServiceModule, cryptoModule;
let InviteToken, User, sendEmail, crypto;
let sendInviteToken, verifyInviteToken;

beforeAll(async () => {
  inviteTokenModule = await import('../models/inviteToken.js');
  userModule = await import('../models/user.js');
  emailServiceModule = await import('../utils/emailService.js');
  cryptoModule = await import('crypto');
  
  InviteToken = inviteTokenModule.InviteToken;
  User = userModule.User;
  sendEmail = emailServiceModule.sendEmail;
  crypto = cryptoModule.default;
});

beforeEach(async () => {
  const controller = await import('../controllers/inviteController.js');
  sendInviteToken = controller.sendInviteToken;
  verifyInviteToken = controller.verifyInviteToken;
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mocks
  InviteToken.mockImplementation(function(data) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(true)
    };
  });
  InviteToken.findOne = jest.fn();
  User.findOne = jest.fn();
  sendEmail.mockResolvedValue(undefined);
  crypto.randomBytes.mockReturnValue(Buffer.from('testtoken123'));
});

describe('Invite Controller', () => {
  describe('sendInviteToken', () => {
    it('should send invite token successfully', async () => {
      User.findOne.mockResolvedValue(null); // No existing user
      
      const req = createMockReq({
        body: { email: 'driver@example.com' }
      });
      const res = createMockRes();
      
      await sendInviteToken(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: 'driver@example.com' });
      expect(crypto.randomBytes).toHaveBeenCalledWith(10);
      expect(InviteToken).toHaveBeenCalledWith({
        token: '74657374746f6b656e313233', // hex of 'testtoken123'
        email: 'driver@example.com',
        owner: 'user123',
        expiresAt: expect.any(Date)
      });
      expect(sendEmail).toHaveBeenCalledWith(
        'driver@example.com',
        'Driver Registration Invite',
        expect.stringContaining('http://localhost:3000/register-driver?token=74657374746f6b656e313233')
      );
      expect(res.send).toHaveBeenCalledWith({
        message: 'Invite sent successfully',
        token: '74657374746f6b656e313233'
      });
    });
    
    it('should handle missing email', async () => {
      const req = createMockReq({
        body: {}
      });
      const res = createMockRes();
      
      await sendInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Driver email is required.');
    });
    
    it('should handle existing user email', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing123', email: 'driver@example.com' });
      
      const req = createMockReq({
        body: { email: 'driver@example.com' }
      });
      const res = createMockRes();
      
      await sendInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Email is already registered' });
    });
    
    it('should handle server errors', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      const req = createMockReq({
        body: { email: 'driver@example.com' }
      });
      const res = createMockRes();
      
      await sendInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to send invite',
        error: 'Database error'
      });
    });
  });
  
  describe('verifyInviteToken', () => {
    it('should verify valid invite token successfully', async () => {
      const mockToken = {
        _id: 'token123',
        token: 'validtoken',
        email: 'driver@example.com',
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      };
      
      InviteToken.findOne.mockResolvedValue(mockToken);
      
      const req = createMockReq({
        body: { token: 'validtoken' }
      });
      const res = createMockRes();
      
      await verifyInviteToken(req, res);
      
      expect(InviteToken.findOne).toHaveBeenCalledWith({ token: 'validtoken', isUsed: false });
      expect(res.send).toHaveBeenCalledWith({
        valid: true,
        email: 'driver@example.com'
      });
    });
    
    it('should handle missing token', async () => {
      const req = createMockReq({
        body: {}
      });
      const res = createMockRes();
      
      await verifyInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Token is required' });
    });
    
    it('should handle invalid token', async () => {
      InviteToken.findOne.mockResolvedValue(null);
      
      const req = createMockReq({
        body: { token: 'invalidtoken' }
      });
      const res = createMockRes();
      
      await verifyInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });
    
    it('should handle used token', async () => {
      const mockToken = {
        _id: 'token123',
        token: 'usedtoken',
        email: 'driver@example.com',
        isUsed: true,
        expiresAt: new Date(Date.now() + 3600000)
      };
      
      // Mock the findOne to respect the query filter - used tokens should not be found when querying for isUsed: false
      InviteToken.findOne.mockResolvedValue(null);
      
      const req = createMockReq({
        body: { token: 'usedtoken' }
      });
      const res = createMockRes();
      
      await verifyInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });
    
    it('should handle expired token', async () => {
      const mockToken = {
        _id: 'token123',
        token: 'expiredtoken',
        email: 'driver@example.com',
        isUsed: false,
        expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
      };
      
      InviteToken.findOne.mockResolvedValue(mockToken);
      
      const req = createMockReq({
        body: { token: 'expiredtoken' }
      });
      const res = createMockRes();
      
      await verifyInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });
    
    it('should handle server errors', async () => {
      InviteToken.findOne.mockRejectedValue(new Error('Database error'));
      
      const req = createMockReq({
        body: { token: 'validtoken' }
      });
      const res = createMockRes();
      
      await verifyInviteToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
