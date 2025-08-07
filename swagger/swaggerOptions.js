// swagger/swaggerOptions.js
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Truck Fleet Management API",
      version: "1.0.0",
      description: "API docs for Truck Fleet Management System",
    },
    servers: [
      {
        url: "http://localhost:3000", // change if needed
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // 🔁 add correct path to route files
};

module.exports = options;
