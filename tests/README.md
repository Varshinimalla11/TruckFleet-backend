# Truck Fleet Management Backend - Testing Guide

This directory contains comprehensive unit tests for all controllers in the Truck Fleet Management backend application.

## 🧪 Test Coverage

The test suite covers all major controllers:

- **Auth Controller** (`authController.test.js`) - Authentication, registration, login, OTP verification
- **Dashboard Controller** (`dashboardController.test.js`) - Dashboard statistics and recent data
- **Truck Controller** (`truckController.test.js`) - CRUD operations for trucks
- **Trip Controller** (`tripController.test.js`) - Trip management and lifecycle
- **Drive Session Controller** (`driveSessionController.test.js`) - Driving sessions and rest periods
- **Refuel Event Controller** (`refuelEventController.test.js`) - Fuel logging and tracking
- **Rest Log Controller** (`restLogController.test.js`) - Rest period management
- **Notification Controller** (`notificationController.test.js`) - User notifications
- **Invite Controller** (`inviteController.test.js`) - Driver invitation system

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Jest testing framework (already configured)

### Running Tests

#### Run All Tests

```bash
npm test
```

#### Run Tests with Coverage

```bash
npm test -- --coverage
```

#### Run Tests in Watch Mode

```bash
npm test -- --watch
```

#### Run Specific Test File

```bash
npm test -- authController.test.js
```

#### Run Tests with Verbose Output

```bash
npm test -- --verbose
```

### Test Configuration

The testing setup is configured in `jest.config.js` with:

- ES modules support
- Coverage reporting (HTML, LCOV, text)
- Test environment setup
- Mock configurations
- Global test utilities

## 🏗️ Test Structure

### Test Setup (`setup.js`)

The `setup.js` file provides:

- Global mock configurations for all external dependencies
- Common test utilities (`mockReq`, `mockRes`)
- Automatic mock cleanup between tests
- Centralized mocking strategy

### Mock Strategy

All external dependencies are mocked:

- **Models**: Database models (User, Trip, Truck, etc.)
- **Validation**: Joi validation schemas
- **Utilities**: Email service, notifications, socket utilities
- **Middleware**: Authentication and authorization
- **External Libraries**: bcrypt, JWT, crypto, etc.

### Test Utilities

#### `mockReq(overrides)`

Creates a mock request object with common properties:

```javascript
const req = mockReq({
  body: { email: "test@example.com" },
  user: { _id: "user123", role: "owner" },
});
```

#### `mockRes()`

Creates a mock response object with chainable methods:

```javascript
const res = mockRes();
// Supports: status(), send(), json(), cookie(), etc.
```

## 📝 Writing Tests

### Test Structure

Each test follows this pattern:

```javascript
describe("Controller Name", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = mockReq();
    mockRes = mockRes();
    jest.clearAllMocks();
    // Setup mocks
  });

  describe("Function Name", () => {
    it("should do something successfully", async () => {
      // Arrange
      mockReq.body = {
        /* test data */
      };

      // Act
      await controllerFunction(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith(expectedData);
    });

    it("should handle error case", async () => {
      // Arrange
      mockReq.body = {
        /* invalid data */
      };

      // Act
      await controllerFunction(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: "Error message" });
    });
  });
});
```

### Mocking Examples

#### Mocking Models

```javascript
// Mock User model
const User = jest.fn();
jest.mock("../models/user.js", () => ({ User }));

// Setup mock methods
User.findOne = jest.fn();
User.findById = jest.fn();
User.mockImplementation(() => ({
  save: jest.fn().mockResolvedValue(),
}));
```

#### Mocking Validation

```javascript
const validateUser = jest.fn();
jest.mock("../validationModels/validateUser.js", () => ({ validateUser }));

// Mock validation results
validateUser.mockReturnValue({ error: null }); // Success
validateUser.mockReturnValue({
  error: { details: [{ message: "Validation error" }] },
}); // Failure
```

#### Mocking Utilities

```javascript
const notifyUser = jest.fn();
jest.mock("../utils/notifyUser.js", () => ({ default: notifyUser }));

// Setup mock behavior
notifyUser.mockResolvedValue(); // Success
notifyUser.mockRejectedValue(new Error("Notification failed")); // Failure
```

## 🧹 Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the scenario
- Test both success and failure cases
- Test edge cases and boundary conditions

### 2. Mock Management

- Always clear mocks in `beforeEach`
- Use specific mock implementations for each test
- Verify that mocks are called with expected parameters
- Test error scenarios by mocking failures

### 3. Assertions

- Test response status codes
- Verify response data structure and content
- Check that database operations are called correctly
- Ensure proper error handling

### 4. Test Data

- Use realistic test data
- Test with different user roles and permissions
- Include edge cases (empty data, invalid IDs, etc.)
- Test both valid and invalid inputs

## 📊 Coverage Reports

After running tests with coverage, you'll find:

- **Text Report**: In the terminal output
- **HTML Report**: In `coverage/lcov-report/index.html`
- **LCOV Report**: In `coverage/lcov.info`

### Coverage Targets

The test suite aims for:

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >95%
- **Lines**: >90%

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all mocks are properly configured in `setup.js`
2. **Mock Not Working**: Check that mocks are cleared in `beforeEach`
3. **Async Test Failures**: Use `async/await` and proper error handling
4. **Coverage Issues**: Verify that all code paths are tested

### Debug Mode

Run tests with debug output:

```bash
npm test -- --verbose --detectOpenHandles
```

### Isolated Testing

Test a single controller in isolation:

```bash
npm test -- --testPathPattern=authController.test.js
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Jest Mocking Guide](https://jestjs.io/docs/mock-functions)
- [Testing Best Practices](https://jestjs.io/docs/best-practices)

## 🤝 Contributing

When adding new tests:

1. Follow the existing test structure
2. Ensure proper mocking of dependencies
3. Test both success and failure scenarios
4. Maintain high test coverage
5. Update this README if needed

---

**Happy Testing! 🎯**

