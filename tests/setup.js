import { jest } from '@jest/globals';

// All global jest.mock calls commented out to prevent conflicts with ES module mocks
// jest.mock('bcrypt');
// jest.mock('jsonwebtoken');
// jest.mock('crypto');
// jest.mock('config');
// jest.mock('nodemailer');
// jest.mock('socket.io');

// jest.mock('../models/user.js');
// jest.mock('../models/otp.js');
// jest.mock('../models/inviteToken.js');
// jest.mock('../models/emailVerification.js');
// jest.mock('../models/driveSession.js');
// jest.mock('../models/trip.js');
// jest.mock('../models/truck.js');
// jest.mock('../models/refuelEvent.js');
// jest.mock('../models/restLog.js');
// jest.mock('../models/notification.js');
// jest.mock('../models/owner.js');

// jest.mock('../validationModels/validateUser.js');
// jest.mock('../validationModels/validateOtp.js');
// jest.mock('../validationModels/validatePasswordReset.js');
// jest.mock('../validationModels/validateDriveSession.js');
// jest.mock('../validationModels/validateTrip.js');
// jest.mock('../validationModels/validateTruck.js');
// jest.mock('../validationModels/validateRefuel.js');
// jest.mock('../validationModels/validateRestLog.js');

// jest.mock('../utils/emailService.js');
// jest.mock('../utils/notifyUser.js');
// jest.mock('../utils/socketUtils.js');

// jest.mock('../middleware/auth.js');
// jest.mock('../middleware/authorizeRole.js');

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.resetAllMocks();
});
