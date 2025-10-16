const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SkyNest Hotels API',
            version: '1.0.0',
            description: 'Hotel Reservation & Management System API Documentation',
            contact: {
                name: 'SkyNest Hotels',
                email: 'support@skynest.lk'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'integer' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        full_name: { type: 'string' },
                        role: { type: 'string', enum: ['Admin', 'Receptionist', 'Guest'] },
                        branch_id: { type: 'integer' },
                        phone: { type: 'string' },
                        is_active: { type: 'boolean' }
                    }
                },
                Booking: {
                    type: 'object',
                    properties: {
                        booking_id: { type: 'integer' },
                        guest_id: { type: 'integer' },
                        room_id: { type: 'integer' },
                        check_in_date: { type: 'string', format: 'date' },
                        check_out_date: { type: 'string', format: 'date' },
                        booking_status: { type: 'string', enum: ['Booked', 'Checked-In', 'Checked-Out', 'Cancelled'] },
                        total_amount: { type: 'number' },
                        outstanding_amount: { type: 'number' }
                    }
                },
                Room: {
                    type: 'object',
                    properties: {
                        room_id: { type: 'integer' },
                        room_number: { type: 'string' },
                        room_type_id: { type: 'integer' },
                        branch_id: { type: 'integer' },
                        floor_number: { type: 'integer' },
                        status: { type: 'string', enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'] }
                    }
                },
                Tax: {
                    type: 'object',
                    properties: {
                        tax_config_id: { type: 'integer' },
                        branch_id: { type: 'integer' },
                        tax_name: { type: 'string' },
                        tax_type: { type: 'string' },
                        tax_rate: { type: 'number' },
                        is_active: { type: 'boolean' }
                    }
                },
                Discount: {
                    type: 'object',
                    properties: {
                        discount_config_id: { type: 'integer' },
                        branch_id: { type: 'integer' },
                        discount_name: { type: 'string' },
                        discount_type: { type: 'string', enum: ['Percentage', 'Fixed Amount'] },
                        discount_value: { type: 'number' },
                        promo_code: { type: 'string' },
                        is_active: { type: 'boolean' }
                    }
                },
                Fee: {
                    type: 'object',
                    properties: {
                        fee_config_id: { type: 'integer' },
                        branch_id: { type: 'integer' },
                        fee_type: { type: 'string' },
                        fee_calculation: { type: 'string', enum: ['Fixed Amount', 'Percentage', 'Per Hour'] },
                        fee_value: { type: 'number' },
                        is_active: { type: 'boolean' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        },
        tags: [
            { name: 'Authentication', description: 'User authentication endpoints' },
            { name: 'Bookings', description: 'Booking management' },
            { name: 'Rooms', description: 'Room management' },
            { name: 'Guests', description: 'Guest management' },
            { name: 'Services', description: 'Service management' },
            { name: 'Payments', description: 'Payment processing' },
            { name: 'Tax & Discount', description: 'Tax and discount configuration' },
            { name: 'Fees', description: 'Fee management' },
            { name: 'Reports', description: 'Reporting endpoints' },
            { name: 'Users', description: 'User management' }
        ]
    },
    apis: ['./routes/*.js', './controllers/*.js'] // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
