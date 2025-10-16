# 🏨 SkyNest Hotels - Reservation & Management System

A comprehensive hotel management system built with React, Node.js, Express, and MySQL. This full-stack application provides complete hotel operations management including bookings, guest services, payments, and staff coordination.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### 🔐 **Multi-Role Authentication**
- **Admin**: Full system access and management
- **Receptionist**: Branch-specific operations
- **Guest**: Self-service portal

### 📅 **Booking Management**
- Real-time room availability checking
- Double booking prevention with database triggers
- Check-in/Check-out processing
- Booking modifications and cancellations
- Special requests handling

### 🏠 **Room Management**
- Multiple room types (Single, Double, Deluxe, Suite)
- Room status tracking (Available, Occupied, Reserved, Maintenance)
- Branch-wise room inventory
- Dynamic pricing support

### 👥 **Guest Management**
- Guest profile management
- Booking history tracking
- Guest portal for self-service

### 💰 **Payment Processing**
- Partial payment support
- Payment history tracking
- Outstanding balance management
- Automated bill calculation

### 🛎️ **Service Management**
- Service catalogue (Room Service, Spa, Laundry, etc.)
- Guest service requests with approval workflow
- Branch-specific service pricing
- Service usage tracking and billing

### 🎫 **Support System**
- Ticket creation and management
- Staff response system
- Ticket status tracking (Open, In Progress, Resolved, Closed)

### 📊 **Reports & Analytics**
- Revenue reports by branch
- Occupancy statistics
- Service usage analytics
- Payment summaries
- Guest booking history

### 🔔 **Real-time Updates**
- Live booking status
- Instant payment updates
- Service request notifications
- Support ticket alerts

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18.2** - UI library
- **React Router DOM 6** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Recharts** - Data visualization
- **React Toastify** - Notifications
- **Date-fns** - Date manipulation
- **Vite** - Build tool

### **Backend**
- **Node.js** - Runtime environment
- **Express.js 4.18** - Web framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **Bcrypt.js** - Password hashing
- **Express Validator** - Input validation
- **Morgan** - HTTP logging
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### **Database**
- **MySQL 8.0** - Relational database
- **Stored Procedures** - Business logic
- **Triggers** - Data integrity
- **Views** - Query optimization
- **Indexes** - Performance optimization

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin UI   │  │ Receptionist │  │   Guest UI   │      │
│  │  Dashboard   │  │  Dashboard   │  │   Portal     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                    React + Vite                              │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js REST API                     │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │   │
│  │  │  Auth  │ │Booking │ │Payment │ │Service │       │   │
│  │  │  JWT   │ │ Logic  │ │ Logic  │ │ Logic  │       │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │   │
│  └──────────────────────────────────────────────────────┘   │
│                    Node.js + Express                         │
└─────────────────────────────────────────────────────────────┘
                            ↕ MySQL2
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   MySQL Database                     │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │   │
│  │  │ Tables │ │ Views  │ │Triggers│ │ Stored │       │   │
│  │  │        │ │        │ │        │ │  Proc  │       │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Hotel-SkyNest/
│
├── backend/                      # Backend API
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── controllers/             # Business logic
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── guestController.js
│   │   ├── paymentController.js
│   │   ├── reportController.js
│   │   ├── roomController.js
│   │   ├── serviceController.js
│   │   ├── serviceRequestController.js
│   │   ├── supportController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Error handling
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── guestRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── serviceRequestRoutes.js
│   │   ├── supportRoutes.js
│   │   └── userRoutes.js
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── package.json
│   └── server.js                # Entry point
│
├── frontend/                    # Frontend React app
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── Card.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Table.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication state
│   │   ├── pages/               # Page components
│   │   │   ├── dashboards/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── GuestDashboard.jsx
│   │   │   │   └── ReceptionistDashboard.jsx
│   │   │   ├── guest/
│   │   │   │   ├── BookingDetails.jsx
│   │   │   │   ├── ContactSupport.jsx
│   │   │   │   ├── MyBookings.jsx
│   │   │   │   └── RequestService.jsx
│   │   │   ├── BookingDetails.jsx
│   │   │   ├── Bookings.jsx
│   │   │   ├── CreateBooking.jsx
│   │   │   ├── GuestDetails.jsx
│   │   │   ├── Guests.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Rooms.jsx
│   │   │   ├── ServiceRequests.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── SupportTickets.jsx
│   │   │   └── Users.jsx
│   │   ├── styles/              # CSS files
│   │   │   ├── AdminDashboard.css
│   │   │   ├── App.css
│   │   │   ├── BookingDetails.css
│   │   │   ├── Bookings.css
│   │   │   ├── Card.css
│   │   │   ├── CreateBooking.css
│   │   │   ├── GuestDashboard.css
│   │   │   ├── Guests.css
│   │   │   ├── Layout.css
│   │   │   ├── Login.css
│   │   │   ├── Modal.css
│   │   │   ├── Payments.css
│   │   │   ├── ReceptionistDashboard.css
│   │   │   ├── Reports.css
│   │   │   └── Rooms.css
│   │   ├── utils/
│   │   │   ├── api.js           # API client
│   │   │   └── helpers.js       # Utility functions
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── database/                    # Database scripts
    ├── schema.sql               # Database structure
    ├── seed_data.sql            # Initial data
    ├── procedures.sql           # Stored procedures
    ├── triggers.sql             # Database triggers
    ├── reports.sql              # Report procedures
    ├── database_efficiency_improvements.sql
    └── generate_hashes.js       # Password hash generator
```

---

## 🚀 Installation

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup instructions.

**Quick Start:**

```bash
# Clone repository
git clone https://github.com/yourusername/Hotel-SkyNest.git
cd Hotel-SkyNest

# Setup database (ONE COMMAND - Easy!)
mysql -u root -p < database/COMPLETE_DATABASE_SETUP.sql

# OR setup step-by-step (if preferred)
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed_data.sql
mysql -u root -p < database/procedures.sql
mysql -u root -p < database/triggers.sql
mysql -u root -p < database/reports.sql
mysql -u root -p < database/database_efficiency_improvements.sql

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start

# Setup frontend (in new terminal)
cd frontend
npm install
npm run dev
```

---

## 💻 Usage

### **Default Credentials**

**Admin:**
- Username: `admin`
- Password: `Admin@123`

**Receptionist (Colombo):**
- Username: `receptionist1`
- Password: `Recep@123`

**Guest:**
- Username: `john.doe`
- Password: `Guest@123`

### **Access URLs**

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 📡 API Documentation

### **Authentication**
```
POST   /api/auth/login          # User login
POST   /api/auth/register       # Guest registration
GET    /api/auth/me             # Get current user
```

### **Bookings**
```
GET    /api/bookings            # Get all bookings
GET    /api/bookings/:id        # Get booking details
POST   /api/bookings            # Create booking
PUT    /api/bookings/:id        # Update booking
DELETE /api/bookings/:id        # Cancel booking
POST   /api/bookings/:id/checkin    # Check-in guest
POST   /api/bookings/:id/checkout   # Check-out guest
```

### **Rooms**
```
GET    /api/rooms               # Get all rooms
GET    /api/rooms/available     # Get available rooms
POST   /api/rooms               # Create room
PUT    /api/rooms/:id           # Update room
DELETE /api/rooms/:id           # Delete room
```

### **Guests**
```
GET    /api/guests              # Get all guests
GET    /api/guests/:id          # Get guest details
POST   /api/guests              # Create guest
PUT    /api/guests/:id          # Update guest
```

### **Payments**
```
GET    /api/payments            # Get all payments
POST   /api/payments            # Process payment
GET    /api/payments/booking/:id   # Get booking payments
```

### **Services**
```
GET    /api/services            # Get service catalogue
POST   /api/services            # Add service
PUT    /api/services/:id        # Update service
```

### **Service Requests**
```
GET    /api/service-requests    # Get all requests
POST   /api/service-requests    # Create request
PUT    /api/service-requests/:id/review  # Approve/Reject
```

### **Support**
```
GET    /api/support/tickets     # Get all tickets
POST   /api/support/tickets     # Create ticket
GET    /api/support/tickets/:id # Get ticket details
PUT    /api/support/tickets/:id # Update ticket
POST   /api/support/tickets/:id/response  # Add response
```

### **Reports**
```
GET    /api/reports/revenue     # Revenue report
GET    /api/reports/occupancy   # Occupancy report
GET    /api/reports/services    # Service usage report
```

---

## 🗄️ Database Schema

See [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) for complete database documentation.

**Core Tables:**
- `hotel_branches` - Hotel branch information
- `room_types` - Room type definitions
- `rooms` - Individual room inventory
- `users` - System users (Admin, Receptionist, Guest)                                                            
- `guests` - Guest profiles
- `bookings` - Room reservations
- `service_catalogue` - Available services
- `service_usage` - Services used by guests
- `service_requests` - Guest service requests
- `payments` - Payment transactions
- `support_tickets` - Customer support tickets
- `ticket_responses` - Support ticket responses

---

## 🎨 Styling Guide

See [STYLING_GUIDE.md](./STYLING_GUIDE.md) for detailed styling instructions.

---

## 🐳 Docker Support

See [Dockerfile](./Dockerfile) and [docker-compose.yml](./docker-compose.yml) for containerization.

---

## 🔄 CI/CD Pipeline

See [CICD_GUIDE.md](./CICD_GUIDE.md) for continuous integration and deployment setup.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Authors

**UOM CSE students**

---

## 🙏 Acknowledgments

- React community for excellent documentation
- Express.js team for the robust framework
- MySQL for reliable database management
- All contributors and testers

---

## 📞 Support

For support, email sithijaseneviratne@gmail.com or create an issue in the repository.

---

**Made with ❤️ by UOM CSE students**
