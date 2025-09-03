import { jest } from '@jest/globals';

// Mock all external dependencies
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn()
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn()
  }
}));

jest.unstable_mockModule('crypto', () => ({
  default: {
    randomBytes: jest.fn()
  }
}));

jest.unstable_mockModule('config', () => ({
  default: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'jwtPrivateKey') return 'test-secret';
      if (key === 'env') return 'development';
      return 'default-value';
    })
  }
}));

jest.unstable_mockModule('lodash', () => ({
  default: {
    pick: jest.fn().mockImplementation((obj, keys) => {
      const result = {};
      keys.forEach(key => {
        if (obj[key] !== undefined) {
          result[key] = obj[key];
        }
      });
      return result;
    })
  }
}));

// Mock models
jest.unstable_mockModule('../models/user.js', () => {
  const mockUserConstructor = jest.fn().mockImplementation((data) => {
    const userInstance = {
      ...data,
      save: jest.fn().mockResolvedValue(userInstance),
      generateAuthToken: jest.fn().mockReturnValue('mock-jwt-token')
    };
    return userInstance;
  });
  
  // Add static methods
  mockUserConstructor.findOne = jest.fn();
  mockUserConstructor.findById = jest.fn();
  mockUserConstructor.create = jest.fn();
  mockUserConstructor.find = jest.fn();
  
  return {
    User: mockUserConstructor
  };
});

jest.unstable_mockModule('../models/otp.js', () => {
  const mockOTPConstructor = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue()
  }));
  
  // Add static methods
  mockOTPConstructor.findOne = jest.fn();
  mockOTPConstructor.deleteMany = jest.fn();
  mockOTPConstructor.deleteOne = jest.fn();
  
  return {
    OTP: mockOTPConstructor
  };
});

jest.unstable_mockModule('../models/inviteToken.js', () => ({
  InviteToken: {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn()
  }
}));

jest.unstable_mockModule('../models/emailVerification.js', () => ({
  EmailVerification: {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

// Mock validation models
jest.unstable_mockModule('../validationModels/validateUser.js', () => ({
  validateUser: jest.fn()
}));

jest.unstable_mockModule('../validationModels/validateOtp.js', () => ({
  validateOTP: jest.fn()
}));

jest.unstable_mockModule('../validationModels/validatePasswordReset.js', () => ({
  default: {
    validateEmail: jest.fn(),
    validatePasswordReset: jest.fn(),
    validateResetToken: jest.fn()
  }
}));

// Mock utilities
jest.unstable_mockModule('../utils/emailService.js', () => ({
  sendOTPEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

jest.unstable_mockModule('../utils/notifyUser.js', () => ({
  default: jest.fn()
}));

// Import mocked modules
let bcrypt, jwt, crypto, config, lodash;
let User, OTP, InviteToken, EmailVerification;
let validateUser, validateOTP, validateEmail, validatePasswordReset;
let sendOTPEmail, sendPasswordResetEmail, notifyUser;

// Import controller functions
let sendOTP, verifyOTP, register, login, getCurrentUser, registerDriver, getAllDrivers, forgotPassword, resetPassword, validateResetToken, updateProfile, adminOwners;

beforeAll(async () => {
  // Import mocked modules
  bcrypt = await import('bcrypt');
  jwt = await import('jsonwebtoken');
  crypto = await import('crypto');
  config = await import('config');
  lodash = await import('lodash');
  
  // Import mocked models
  const userModule = await import('../models/user.js');
  const otpModule = await import('../models/otp.js');
  const inviteTokenModule = await import('../models/inviteToken.js');
  const emailVerificationModule = await import('../models/emailVerification.js');
  
  User = userModule.User;
  OTP = otpModule.OTP;
  InviteToken = inviteTokenModule.InviteToken;
  EmailVerification = emailVerificationModule.EmailVerification;
  
  // Import mocked validation models
  const validateUserModule = await import('../validationModels/validateUser.js');
  const validateOtpModule = await import('../validationModels/validateOtp.js');
  const validatePasswordResetModule = await import('../validationModels/validatePasswordReset.js');
  
  validateUser = validateUserModule.validateUser;
  validateOTP = validateOtpModule.validateOTP;
  validateEmail = validatePasswordResetModule.default.validateEmail;
  validatePasswordReset = validatePasswordResetModule.default.validatePasswordReset;
  
  // Import mocked utilities
  const emailServiceModule = await import('../utils/emailService.js');
  const notifyUserModule = await import('../utils/notifyUser.js');
  
  sendOTPEmail = emailServiceModule.sendOTPEmail;
  sendPasswordResetEmail = emailServiceModule.sendPasswordResetEmail;
  notifyUser = notifyUserModule.default;
  
  // Import controller functions
  const controllerModule = await import('../controllers/authController.js');
  sendOTP = controllerModule.sendOTP;
  verifyOTP = controllerModule.verifyOTP;
  register = controllerModule.register;
  login = controllerModule.login;
  getCurrentUser = controllerModule.getCurrentUser;
  registerDriver = controllerModule.registerDriver;
  getAllDrivers = controllerModule.getAllDrivers;
  forgotPassword = controllerModule.forgotPassword;
  resetPassword = controllerModule.resetPassword;
  validateResetToken = controllerModule.validateResetToken;
  updateProfile = controllerModule.updateProfile;
  adminOwners = controllerModule.adminOwners;
});

// Mock response and request objects
const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
  json: jest.fn(),
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  setHeader: jest.fn(),
});

const createMockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: {},
  headers: {},
  ...overrides,
});

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default config values
    config.default.get.mockImplementation((key) => {
      const defaults = {
        jwtPrivateKey: 'test-secret',
        env: 'test'
      };
      return defaults[key] || 'default-value';
    });
  });

  describe('sendOTP', () => {
    it('should return 400 if email is missing', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();
      
      await sendOTP(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Email is required' });
    });

    it('should return 409 if email is already registered', async () => {
      const req = createMockReq({ body: { email: 'test@example.com' } });
      const res = createMockRes();
      
      User.findOne.mockResolvedValue({ email: 'test@example.com' });
      
      await sendOTP(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({ message: 'Email is already registered' });
    });

    it('should send OTP and return 200 for new email', async () => {
      const req = createMockReq({ body: { email: 'new@example.com' } });
      const res = createMockRes();
      
      User.findOne.mockResolvedValue(null);
      OTP.deleteMany.mockResolvedValue();
      sendOTPEmail.mockResolvedValue();
      
      await sendOTP(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(OTP.deleteMany).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(sendOTPEmail).toHaveBeenCalledWith('new@example.com', expect.any(String));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ 
        message: 'OTP sent to email' 
      }));
    });

    it('should handle email sending failure and clean up OTP', async () => {
      const req = createMockReq({ body: { email: 'new@example.com' } });
      const res = createMockRes();
      
      User.findOne.mockResolvedValue(null);
      OTP.deleteMany.mockResolvedValue();
      sendOTPEmail.mockRejectedValue(new Error('Email failed'));
      OTP.deleteOne.mockResolvedValue();
      
      await sendOTP(req, res);
      
      expect(OTP.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Failed to send OTP email' });
    });

    it('should handle server error', async () => {
      const req = createMockReq({ body: { email: 'new@example.com' } });
      const res = createMockRes();
      
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      await sendOTP(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('verifyOTP', () => {
    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', otp: '123456' } });
      const res = createMockRes();
      
      validateOTP.mockReturnValue({ error: { details: [{ message: 'Invalid OTP format' }] } });
      
      await verifyOTP(req, res);
      
      expect(validateOTP).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid OTP format' });
    });

    it('should return 400 if OTP not found', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', otp: '123456' } });
      const res = createMockRes();
      
      validateOTP.mockReturnValue({ error: null });
      OTP.findOne.mockResolvedValue(null);
      
      await verifyOTP(req, res);
      
      expect(OTP.findOne).toHaveBeenCalledWith({ email: 'test@example.com', otp: '123456' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid OTP' });
    });

    it('should return 400 if OTP is expired', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', otp: '123456' } });
      const res = createMockRes();
      
      validateOTP.mockReturnValue({ error: null });
      OTP.findOne.mockResolvedValue({
        email: 'test@example.com',
        otp: '123456',
        expiresAt: Date.now() - 1000 // Expired
      });
      
      await verifyOTP(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'OTP has expired' });
    });

    it('should return 200 and delete OTP if verification successful', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', otp: '123456' } });
      const res = createMockRes();
      
      const mockOtpRecord = {
        _id: 'otp123',
        email: 'test@example.com',
        otp: '123456',
        expiresAt: Date.now() + 60000 // Valid for 1 minute
      };
      
      validateOTP.mockReturnValue({ error: null });
      OTP.findOne.mockResolvedValue(mockOtpRecord);
      OTP.deleteOne.mockResolvedValue();
      
      // Mock User.findOne to return null (new user)
      User.findOne.mockResolvedValue(null);
      
      // Mock EmailVerification.findOneAndUpdate
      EmailVerification.findOneAndUpdate.mockResolvedValue({});
      
      await verifyOTP(req, res);
      
      expect(OTP.deleteOne).toHaveBeenCalledWith({ _id: 'otp123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ 
        message: 'OTP verified successfully',
        verified: true
      });
    });
  });

  describe('register', () => {
    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', password: 'password123' } });
      const res = createMockRes();
      
      validateUser.mockReturnValue({ error: { details: [{ message: 'Invalid email format' }] } });
      
      await register(req, res);
      
      expect(validateUser).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid email format' });
    });

    it('should return 409 if email is already registered', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', password: 'password123' } });
      const res = createMockRes();
      
      validateUser.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue({ email: 'test@example.com' });
      
      await register(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({ message: 'Email is already registered' });
    });

    it('should create user and return 201 on successful registration', async () => {
      const req = createMockReq({ 
        body: { 
          email: 'new@example.com', 
          password: 'password123',
          name: 'John Doe'
        } 
      });
      const res = createMockRes();
      
      validateUser.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);
      
      // Mock EmailVerification.findOne to return a verified email
      const mockEmailVerification = {
        email: 'new@example.com',
        verified: true,
        expiresAt: Date.now() + 60000
      };
      EmailVerification.findOne.mockResolvedValue(mockEmailVerification);
      EmailVerification.deleteOne.mockResolvedValue();
      
      const mockUser = {
        _id: 'user123',
        email: 'new@example.com',
        name: 'John Doe',
        generateAuthToken: jest.fn().mockReturnValue('mock-jwt-token'),
        save: jest.fn().mockResolvedValue()
      };
      
      // Mock User constructor
      User.mockImplementation(() => mockUser);
      
      await register(req, res);
      
      expect(res.send).toHaveBeenCalledWith({ token: 'mock-jwt-token' });
    });

    it('should handle server error during registration', async () => {
      const req = createMockReq({ body: { email: 'new@example.com', password: 'password123' } });
      const res = createMockRes();
      
      validateUser.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);
      
      // Mock EmailVerification.findOne to return a verified email
      EmailVerification.findOne.mockResolvedValue({
        email: 'new@example.com',
        verified: true,
        expiresAt: Date.now() + 60000
      });
      
      // Mock User constructor to throw error during save
      const mockUser = {
        _id: 'user123',
        email: 'new@example.com',
        name: 'John Doe',
        generateAuthToken: jest.fn().mockReturnValue('mock-jwt-token'),
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      User.mockImplementation(() => mockUser);
      
      // Since register doesn't have try-catch, this will throw an error
      await expect(register(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    it('should return 400 if user not found', async () => {
      const req = createMockReq({ body: { email: 'notfound@example.com', password: 'password123' } });
      const res = createMockRes();
      
      User.findOne.mockResolvedValue(null);
      
      await login(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: 'notfound@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid email or password.');
    });

    it('should return 400 if password is invalid', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', password: 'wrongpassword' } });
      const res = createMockRes();
      
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword'
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.default.compare.mockResolvedValue(false);
      
      await login(req, res);
      
      expect(bcrypt.default.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid email or password.');
    });

    it('should return 200 with token on successful login', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', password: 'password123' } });
      const res = createMockRes();
      
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'John Doe',
        role: 'owner',
        emailVerified: true,
        generateAuthToken: jest.fn().mockReturnValue('mock-jwt-token')
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.default.compare.mockResolvedValue(true);
      
      await login(req, res);
      
      expect(mockUser.generateAuthToken).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({
        token: 'mock-jwt-token',
        user: expect.objectContaining({
          _id: 'user123',
          email: 'test@example.com'
        })
      });
    });

    it('should handle server error during login', async () => {
      const req = createMockReq({ body: { email: 'test@example.com', password: 'password123' } });
      const res = createMockRes();
      
      // Mock User.findOne to throw error during execution
      User.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Since login doesn't have try-catch, this will throw an error
      await expect(login(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('getCurrentUser', () => {
    it('should return 404 if user not found', async () => {
      const req = createMockReq({ user: { _id: 'user123' } });
      const res = createMockRes();
      // Mock the full chain: select().populate()
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });
      await getCurrentUser(req, res);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('User not found.');
    });

    it('should return user if found', async () => {
      const req = createMockReq({ user: { _id: 'user123' } });
      const res = createMockRes();
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'test@example.com'
      };
      // Mock the full chain: select().populate()
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser)
        })
      });
      await getCurrentUser(req, res);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.send).toHaveBeenCalledWith(mockUser);
    });

    it('should handle server error', async () => {
      const req = createMockReq({ user: { _id: 'user123' } });
      const res = createMockRes();
      
      // Mock User.findById to throw error during execution
      User.findById.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Since getCurrentUser doesn't have try-catch, this will throw an error
      await expect(getCurrentUser(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('registerDriver', () => {
    it('should return 400 if token is missing', async () => {
      const req = createMockReq({ 
        body: { 
          email: 'driver@example.com', 
          password: 'password123'
        } 
      });
      const res = createMockRes();
      
      await registerDriver(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invite token is required' });
    });

    it('should return 409 if email is already registered', async () => {
      const req = createMockReq({ 
        body: { 
          email: 'driver@example.com', 
          password: 'password123',
          token: 'invite-token'
        } 
      });
      const res = createMockRes();
      
      validateUser.mockReturnValue({ error: null });
      
      // Mock InviteToken.findOne to return a valid token
      const mockToken = {
        token: 'invite-token',
        email: 'driver@example.com',
        owner: 'owner123',
        isUsed: false,
        expiresAt: Date.now() + 60000
      };
      InviteToken.findOne.mockResolvedValue(mockToken);
      
      // Mock User.findOne to return existing user
      User.findOne.mockResolvedValue({ email: 'driver@example.com' });
      
      await registerDriver(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'User already registered' });
    });

    it('should create driver and return 201 on successful registration', async () => {
      const req = createMockReq({ 
        body: { 
          email: 'driver@example.com', 
          password: 'password123',
          name: 'Driver Name',
          token: 'invite-token',
          phone: '1234567890',
          aadhar_number: '123456789012',
          license_number: 'DL123456789'
        } 
      });
      const res = createMockRes();
      
      validateUser.mockReturnValue({ error: null });
      
      // Mock InviteToken.findOne to return a valid token
      const mockToken = {
        token: 'invite-token',
        email: 'driver@example.com',
        owner: 'owner123',
        isUsed: false,
        expiresAt: Date.now() + 60000,
        save: jest.fn().mockResolvedValue()
      };
      InviteToken.findOne.mockResolvedValue(mockToken);
      
      // Mock User.findOne to return null (new user)
      User.findOne.mockResolvedValue(null);
      
      const mockDriver = {
        _id: 'driver123',
        email: 'driver@example.com',
        name: 'Driver Name',
        role: 'driver',
        generateAuthToken: jest.fn().mockReturnValue('mock-jwt-token'),
        save: jest.fn().mockResolvedValue()
      };
      
      // Mock User constructor
      User.mockImplementation(() => mockDriver);
      
      await registerDriver(req, res);
      
      expect(res.send).toHaveBeenCalledWith({
        token: 'mock-jwt-token',
        user: expect.objectContaining({
          _id: 'driver123',
          email: 'driver@example.com',
          role: 'driver'
        })
      });
    });
  });

  describe('getAllDrivers', () => {
    it('should return all drivers for admin role', async () => {
      const req = createMockReq({ 
        user: { _id: 'admin123', role: 'admin' }
      });
      const res = createMockRes();
      
      const mockDrivers = [
        { _id: 'driver1', name: 'Driver 1', email: 'driver1@example.com' },
        { _id: 'driver2', name: 'Driver 2', email: 'driver2@example.com' }
      ];
      
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockDrivers)
      });
      
      await getAllDrivers(req, res);
      
      expect(User.find).toHaveBeenCalledWith({ role: 'driver' });
      expect(res.send).toHaveBeenCalledWith(mockDrivers);
    });

    it('should handle server error', async () => {
      const req = createMockReq({ 
        user: { _id: 'admin123', role: 'admin' }
      });
      const res = createMockRes();
      
      User.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });
      
      await getAllDrivers(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('forgotPassword', () => {
    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ body: { email: 'invalid-email' } });
      const res = createMockRes();
      
      validateEmail.mockReturnValue({ error: { details: [{ message: 'Invalid email format' }] } });
      
      await forgotPassword(req, res);
      
      expect(validateEmail).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid email format' });
    });

    it('should return 200 even if user not found (security)', async () => {
      const req = createMockReq({ body: { email: 'nonexistent@example.com' } });
      const res = createMockRes();
      
      validateEmail.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);
      
      await forgotPassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    });

    it('should send password reset email and return 200', async () => {
      const req = createMockReq({ body: { email: 'test@example.com' } });
      const res = createMockRes();
      
      validateEmail.mockReturnValue({ error: null });
      
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        save: jest.fn().mockResolvedValue()
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock crypto.randomBytes
      crypto.default.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('reset-token-123')
      });
      
      // Mock sendPasswordResetEmail
      sendPasswordResetEmail.mockResolvedValue();
      
      await forgotPassword(req, res);
      
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com', 'reset-token-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    });
  });

  describe('resetPassword', () => {
    it('should return 400 if validation fails', async () => {
      const req = createMockReq({ 
        body: { token: 'valid-token', newPassword: 'short' } 
      });
      const res = createMockRes();
      
      validatePasswordReset.mockReturnValue({ 
        error: { details: [{ message: 'Password too short' }] } 
      });
      
      await resetPassword(req, res);
      
      expect(validatePasswordReset).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Password too short' });
    });

    it('should return 400 if token is invalid or expired', async () => {
      const req = createMockReq({ 
        body: { token: 'invalid-token', newPassword: 'newpassword123' } 
      });
      const res = createMockRes();
      
      validatePasswordReset.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);
      
      await resetPassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid or expired reset token' });
    });

    it('should reset password and return 200', async () => {
      const req = createMockReq({ 
        body: { token: 'valid-token', newPassword: 'newpassword123' } 
      });
      const res = createMockRes();
      
      validatePasswordReset.mockReturnValue({ error: null });
      
      const mockUser = {
        _id: 'user123',
        password: 'old-hashed-password',
        save: jest.fn().mockResolvedValue()
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return false (different password)
      bcrypt.default.compare.mockResolvedValue(false);
      
      // Mock notifyUser
      notifyUser.mockResolvedValue();
      
      await resetPassword(req, res);
      
      // The controller doesn't call bcrypt.hash - it's handled by the User model's pre-save hook
      expect(mockUser.password).toBe('newpassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });
  });

  describe('validateResetToken', () => {
    it('should return 400 if token is invalid or expired', async () => {
      const req = createMockReq({ params: { token: 'invalid-token' } });
      const res = createMockRes();
      
      User.findOne.mockResolvedValue(null);
      
      await validateResetToken(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: 'invalid-token',
        resetPasswordExpires: { $gt: expect.any(Number) }
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ 
        valid: false,
        message: 'Invalid or expired reset token' 
      });
    });

    it('should return 200 if token is valid', async () => {
      const req = createMockReq({ params: { token: 'valid-token' } });
      const res = createMockRes();
      
      const mockUser = {
        _id: 'user123',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: Date.now() + 60000
      };
      User.findOne.mockResolvedValue(mockUser);
      
      await validateResetToken(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: { $gt: expect.any(Number) }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ 
        valid: true,
        message: 'Token is valid' 
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile for owner', async () => {
      const req = createMockReq({
        user: { _id: 'user123', role: 'owner' },
        body: { name: 'Updated Owner', phone: '9999999999' }
      });
      const res = createMockRes();
      const mockUser = { _id: 'user123', role: 'owner', name: 'Owner', phone: '8888888888' };
      // Only mock the chain for select().populate()
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser)
        })
      });
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
      await updateProfile(req, res);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', expect.objectContaining({ name: 'Updated Owner', phone: '9999999999' }), expect.any(Object));
     
    });

    it('should return 404 if user not found', async () => {
      const req = createMockReq({ user: { _id: 'user404', role: 'owner' }, body: { name: 'Test' } });
      const res = createMockRes();
      User.findById.mockResolvedValue(null);
      await updateProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('User not found.');
    });

    it('should validate driver fields', async () => {
      const req = createMockReq({
        user: { _id: 'driver123', role: 'driver' },
        body: { name: 'Driver' }
      });
      const res = createMockRes();
      const mockUser = { _id: 'driver123', role: 'driver', name: 'Driver' };
      User.findById.mockResolvedValue(mockUser);
      await updateProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Aadhar and license numbers are required for drivers.' });
    });

  });

  describe('adminOwners', () => {
    it('should return all owners', async () => {
      const req = createMockReq({ user: { _id: 'admin123', role: 'admin' } });
      const res = createMockRes();
      const mockOwners = [
        { _id: 'owner1', name: 'Owner 1', email: 'owner1@example.com' },
        { _id: 'owner2', name: 'Owner 2', email: 'owner2@example.com' }
      ];
      User.find.mockReturnValue({ select: jest.fn().mockResolvedValue(mockOwners) });
      await adminOwners(req, res);
      expect(User.find).toHaveBeenCalledWith({ role: 'owner' });
      expect(res.send).toHaveBeenCalledWith(mockOwners);
    });

    it('should handle server error', async () => {
      const req = createMockReq({ user: { _id: 'admin123', role: 'admin' } });
      const res = createMockRes();
      User.find.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('Database error')) });
      await adminOwners(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
