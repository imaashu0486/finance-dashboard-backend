const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const { env } = require('./env');

const serverUrl = env.swaggerServerUrl || `http://localhost:${env.port}`;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description: 'Production-grade Finance Dashboard backend API documentation'
    },
    servers: [
      {
        url: serverUrl,
        description: env.nodeEnv === 'production' ? 'Production server' : 'Local server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      parameters: {
        XRoleHeader: {
          in: 'header',
          name: 'x-role',
          schema: {
            type: 'string',
            enum: ['admin', 'analyst', 'viewer']
          },
          required: false,
          description: 'Optional fallback role header. JWT role is primary.'
        }
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Request successful' },
            data: { type: 'object', additionalProperties: true }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' },
            data: { type: 'object', example: {} }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 }
          }
        },
        RefreshTokenRequest: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string' }
          }
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            role: { type: 'string', enum: ['admin', 'analyst', 'viewer'] },
            status: { type: 'string', enum: ['active', 'inactive'], default: 'active' }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            role: { type: 'string', enum: ['admin', 'analyst', 'viewer'] },
            status: { type: 'string', enum: ['active', 'inactive'] }
          }
        },
        FinancialRecordRequest: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { type: 'number', minimum: 0.01 },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string', maxLength: 500 }
          }
        },
        FinancialRecordUpdateRequest: {
          type: 'object',
          properties: {
            amount: { type: 'number', minimum: 0.01 },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string', maxLength: 500 }
          }
        }
      }
    }
  },
  apis: [path.join(__dirname, '../docs/swagger.paths.js')]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
