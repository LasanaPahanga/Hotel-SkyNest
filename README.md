# 🏨 Hotel SkyNest Management System

A comprehensive hotel management system built with React, Node.js, Express, and MySQL. This system provides complete hotel operations management including bookings, payments, service requests, and financial reporting.

## Docker Setup
Go to root folder sky-nests:

```bash
docker build -t skynest-frontend -f Dockerfile.frontend .
docker build -t skynest-backend -f Dockerfile.backend .
docker-compose up -d
```

Frontend Interface: Open your browser and navigate to http://localhost
This should display your React-based frontend application.

Backend API: Access your API at http://localhost:5000
You can test endpoints like http://localhost:5000/api/health to verify it's working.

## Railway Deployment

To deploy on Railway:

1. Push your code to GitHub
2. Connect your GitHub repository to Railway
3. Add the following variables in Railway:
   - `JWT_SECRET`: Your secure JWT secret key
   - `NODE_ENV`: Set to "production"

4. Add a MySQL database service in Railway
5. Deploy your application

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Payment & Financial System](#payment--financial-system)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Database Procedures](#database-procedures)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)

## ✨ Features

### Core Features
- 👥 **User Management** - Multi-role authentication (Admin, Staff, Guest)
- 🏢 **Multi-Branch Support** - Manage multiple hotel branches
- 🛏️ **Room Management** - Room types, availability tracking, and allocation
- 📅 **Booking System** - Real-time booking with availability checking
- 💰 **Advanced Payment Processing** - Multi-payment support with detailed breakdowns
- 🧾 **Tax Management** - Flexible tax configuration (VAT, Service Tax, etc.)
- 🎟️ **Discount System** - Configurable discounts with validation
- 💵 **Fee Management** - Late fees and additional service fees
- 🛎️ **Service Requests** - In-room services and amenities
- 📊 **Comprehensive Reporting** - Revenue, occupancy, and service analytics
- 🎫 **Support Tickets** - Guest support and issue tracking
- 📧 **Email Verification** - Secure user registration

### Advanced Features
- 🔄 **Real-time Room Availability** - Cached availability for performance
- 📈 **Live Bill Calculation** - Dynamic billing with services and taxes
- 🧮 **Automatic Tax Calculation** - Based on branch configuration
- 💳 **Payment Breakdowns** - Detailed itemization of charges
- 🧾 **Receipt Generation** - Automated receipt creation
- 📉 **Audit Logging** - Complete activity tracking
- 📱 **Responsive Design** - Mobile-friendly interface

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Relational database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Database
- **MySQL 8.0+** - Primary database
- **Stored Procedures** - Business logic
- **Triggers** - Data integrity
- **Views** - Optimized queries

## 🗄️ Database Schema

### Core Tables

#### Users & Authentication
- `users` - User accounts and roles
- `email_verification_tokens` - Email verification

#### Hotel Structure
- `hotel_branches` - Branch information
- `room_types` - Room categories and pricing
- `rooms` - Individual room records
- `room_availability_cache` - Availability optimization

#### Booking System
- `bookings` - Reservation records
- `guests` - Guest information
- `booking_taxes` - Tax calculations per booking
- `booking_discounts` - Applied discounts
- `booking_fees` - Additional fees (late fees, etc.)

#### Service Management
- `service_catalogue` - Available services
- `branch_services` - Branch-specific services
- `service_requests` - Service orders
- `service_usage` - Consumed services with pricing

#### Payment System
- `payments` - Payment records
- `payment_breakdowns` - Itemized payment details
- `payment_receipts` - Generated receipts

#### Configuration
- `tax_configurations` - Tax definitions
- `branch_tax_config` - Branch-specific taxes
- `discount_configurations` - Discount rules
- `branch_discount_config` - Branch-specific discounts
- `fee_configurations` - Fee definitions
- `branch_fee_config` - Branch-specific fees

#### Support & Audit
- `support_tickets` - Guest support tickets
- `ticket_responses` - Support responses
- `audit_log` - System activity tracking

## 💰 Payment & Financial System

### Tax Management

The system supports flexible tax configuration per branch with automatic calculation:

#### Tax Types
- **VAT (Value Added Tax)** - 12% on total booking amount (room + services)
- **Service Tax** - 10% on service charges only
- **Custom Taxes** - Configurable per branch

#### Tax Calculation Process
1. Calculate room charges (base price × nights)
2. Add service charges (all consumed services)
3. Apply applicable taxes based on branch configuration
4. Generate `booking_taxes` records

```sql
-- Automatic tax calculation
CALL calculate_booking_taxes(booking_id);
```

### Discount System

#### Discount Types
- **Percentage Discounts** - % off total amount
- **Fixed Amount Discounts** - Flat rate reduction
- **Early Bird Discounts** - Book X days in advance
- **Loyalty Discounts** - Repeat customer benefits
- **Seasonal Discounts** - Holiday/off-season rates

#### Discount Configuration
```javascript
{
  discount_name: "Early Bird 15%",
  discount_type: "percentage",
  value: 15.00,
  min_booking_value: 5000.00,
  min_nights: 2,
  valid_from: "2024-01-01",
  valid_to: "2024-12-31",
  applies_to: "room_charges" // or "total_amount"
}
```

#### Discount Validation
- Minimum booking amount
- Minimum nights requirement
- Date range validation
- Branch-specific availability
- One discount per booking (highest value applied)

### Fee Management

#### Fee Types
1. **Late Checkout Fee** - Charged per hour after checkout time
2. **Early Checkin Fee** - Premium for early arrival
3. **Cancellation Fee** - Based on cancellation policy
4. **Damage Fee** - Room or property damage charges
5. **Service Fees** - Additional service charges

#### Late Fee Calculation
```sql
-- Calculate late checkout fees
IF checkout_time > standard_checkout_time THEN
  late_hours = CEIL(TIMESTAMPDIFF(MINUTE, standard_checkout_time, checkout_time) / 60);
  late_fee = late_hours * hourly_rate;
  INSERT INTO booking_fees (booking_id, fee_config_id, fee_amount);
END IF;
```

### Payment Processing

#### Payment Flow
1. **Calculate Total**
   - Room charges
   - Service charges
   - Taxes (VAT + Service Tax)
   - Fees (late fees, etc.)
   - Discounts applied
   - **Grand Total**

2. **Process Payment**
   ```sql
   CALL process_payment(
     p_booking_id,
     p_amount,
     p_payment_method,
     p_transaction_reference,
     p_processed_by
   );
   ```

3. **Generate Receipt**
   ```sql
   CALL generate_receipt_data(booking_id);
   ```

#### Payment Methods
- Cash
- Credit Card
- Debit Card
- Bank Transfer
- Online Payment Gateway

#### Payment Breakdown Structure
```javascript
{
  room_charges: 8000.00,
  service_charges: 1500.00,
  subtotal: 9500.00,
  
  taxes: [
    { tax_name: "VAT (12%)", amount: 1140.00 },
    { tax_name: "Service Tax (10%)", amount: 150.00 }
  ],
  total_tax: 1290.00,
  
  discounts: [
    { discount_name: "Early Bird 15%", amount: -1200.00 }
  ],
  total_discount: 1200.00,
  
  fees: [
    { fee_name: "Late Checkout", amount: 500.00 }
  ],
  total_fees: 500.00,
  
  grand_total: 10090.00,
  amount_paid: 5000.00,
  balance_due: 5090.00
}
```

### Live Bill Feature

Get real-time bill calculation during guest stay:

```sql
CALL get_live_bill(booking_id);
```

**Returns:**
- Current room charges
- All service usage
- Applied taxes
- Applied discounts
- Any fees
- Current total
- Payment history
- Outstanding balance

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Import database schema
mysql -u root -p < database/schema.sql

# Import stored procedures
mysql -u root -p < database/procedures/*.sql

# Start server
npm start
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure API endpoint
# Edit src/config.js with backend URL

# Start development server
npm start
```

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=skynest_hotels

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email

### Bookings
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/:id/live-bill` - Get current bill

### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments/booking/:id` - Get booking payments
- `GET /api/receipts/:id` - Get payment receipt

### Services
- `GET /api/services` - List available services
- `POST /api/service-requests` - Request service
- `GET /api/service-usage/:bookingId` - Get service usage

### Reports
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/occupancy` - Room occupancy
- `GET /api/reports/services` - Service trends
- `GET /api/reports/unpaid` - Unpaid bookings

## 🔧 Database Procedures

### Booking Procedures
- `create_booking` - Create new reservation
- `cancel_booking` - Cancel reservation with refund calculation
- `check_booking_availability` - Verify room availability
- `check_in_guest` - Process guest check-in
- `check_out_guest` - Process checkout with final billing

### Payment Procedures
- `calculate_booking_total` - Calculate final amount
- `calculate_booking_taxes` - Apply tax calculations
- `process_payment` - Record payment transaction
- `generate_receipt_data` - Create payment receipt
- `get_live_bill` - Real-time bill calculation

### Service Procedures
- `get_branch_services` - List branch services
- `delete_service_usage` - Remove service charge

### Reporting Procedures
- `get_revenue_report` - System-wide revenue
- `get_branch_revenue_report` - Branch-specific revenue
- `get_room_occupancy_report` - Occupancy statistics
- `get_service_trends_report` - Service analytics
- `get_branch_top_services` - Most used services
- `get_unpaid_bookings_report` - Outstanding payments
- `get_guest_history` - Guest booking history

### Support Procedures
- `create_support_ticket` - Create support ticket

## 💡 Usage Examples

### Creating a Booking with Payment

```javascript
// 1. Create booking
const booking = await createBooking({
  guest_id: 123,
  room_id: 45,
  check_in_date: '2024-02-01',
  check_out_date: '2024-02-05',
  number_of_guests: 2,
  special_requests: 'Late checkout if possible'
});

// 2. Add services during stay
await addServiceUsage({
  booking_id: booking.booking_id,
  service_id: 10, // Room service
  quantity: 2,
  unit_price: 1500.00
});

// 3. Get live bill
const liveBill = await getLiveBill(booking.booking_id);
console.log('Current total:', liveBill.grand_total);

// 4. Process payment
const payment = await processPayment({
  booking_id: booking.booking_id,
  amount: liveBill.grand_total,
  payment_method: 'credit_card',
  transaction_reference: 'TXN123456'
});

// 5. Generate receipt
const receipt = await generateReceipt(payment.receipt_id);
```

### Applying Discounts

```javascript
// Discount automatically applied during booking if eligible
const booking = await createBooking({
  // ...booking details
  discount_code: 'EARLYBIRD15' // Optional discount code
});

// System validates:
// - Discount is active
// - Booking meets minimum requirements
// - Date range is valid
// - Applies highest eligible discount
```

### Tax Calculation

```javascript
// Taxes calculated automatically on:
// 1. Booking creation
// 2. Service addition
// 3. Payment processing

// Manual recalculation if needed
await calculateBookingTaxes(booking_id);

// Tax breakdown available in live bill
const bill = await getLiveBill(booking_id);
console.log('VAT:', bill.taxes.find(t => t.tax_name === 'VAT'));
console.log('Service Tax:', bill.taxes.find(t => t.tax_name === 'Service Tax'));
```

### Late Fee Assessment

```javascript
// Late fee automatically calculated on checkout
await checkOutGuest({
  booking_id: 123,
  actual_checkout_time: '2024-02-05 18:30:00', // 6.5 hours late
  checked_out_by: staff_user_id
});

// Late fee added to booking_fees
// Reflected in final bill
```

## 📊 Reporting Features

### Revenue Reports
- Total revenue by date range
- Revenue by branch
- Revenue by payment method
- Tax collected summary

### Occupancy Reports
- Room utilization percentage
- Average occupancy rate
- Peak booking periods
- Available vs occupied rooms

### Service Reports
- Most popular services
- Service revenue trends
- Service usage by branch
- Customer preferences

### Financial Reports
- Unpaid bookings
- Outstanding balances
- Payment collection rate
- Discount usage statistics

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Email verification
- SQL injection prevention
- Audit logging
- Secure payment processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

Hotel SkyNest Development Team

## 📞 Support

For support, email support@hotelskynest.com or create a support ticket in the system.

---

**Built with ❤️ for modern hotel management**
