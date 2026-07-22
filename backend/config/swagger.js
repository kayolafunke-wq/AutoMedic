const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger/OpenAPI Configuration for AutoMedic API
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AutoMedic API Documentation',
      version: '2.0.0',
      description: 'Comprehensive API documentation for the AutoMedic Garage Management System',
      contact: {
        name: 'AutoMedic Support',
        email: 'support@automedic.mw',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.automedic.mw',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (obtained from /api/auth/login)',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'abc123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+265999123456' },
            role: { type: 'string', enum: ['customer', 'technician', 'admin', 'stockkeeper'], example: 'customer' },
            is_active: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'veh123' },
            customer_id: { type: 'string', example: 'cust123' },
            make: { type: 'string', example: 'Toyota' },
            model: { type: 'string', example: 'Corolla' },
            year: { type: 'integer', example: 2020 },
            color: { type: 'string', example: 'Blue' },
            registration_number: { type: 'string', example: 'BT 1234' },
            chassis_number: { type: 'string', example: 'JT123456789' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'appt123' },
            tracking_number: { type: 'string', example: 'TRK-2024-001' },
            customer_id: { type: 'string', example: 'cust123' },
            vehicle_id: { type: 'string', example: 'veh123' },
            service_id: { type: 'string', example: 'svc123' },
            technician_id: { type: 'string', example: 'tech123' },
            preferred_date: { type: 'string', format: 'date' },
            problem_description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'svc123' },
            name: { type: 'string', example: 'Oil Change' },
            description: { type: 'string' },
            category: { type: 'string', example: 'maintenance' },
            base_price: { type: 'number', format: 'float', example: 5000 },
            duration_hours: { type: 'number', format: 'float', example: 1.5 },
            image_url: { type: 'string' },
            is_active: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'prod123' },
            name: { type: 'string', example: 'Engine Oil 5W-30' },
            description: { type: 'string' },
            category: { type: 'string', example: 'lubricants' },
            cost_price: { type: 'number', format: 'float', example: 8000 },
            price: { type: 'number', format: 'float', example: 12000 },
            stock_quantity: { type: 'integer', example: 25 },
            image_url: { type: 'string' },
            is_active: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Authentication required',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Admin access required',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'], // Path to API routes with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI in Express app
 * @param {Express.Application} app - Express application instance
 */
function setupSwagger(app) {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'AutoMedic API Docs',
    })
  );

  console.log('📚 API Documentation available at /api-docs');
}

module.exports = { setupSwagger, swaggerSpec };
