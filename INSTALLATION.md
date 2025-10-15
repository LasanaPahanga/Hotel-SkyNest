# 🚀 Installation Guide

Complete step-by-step guide to install and run SkyNest Hotels from GitHub clone to running servers.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone Repository](#clone-repository)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Node.js** | 14.x or higher | https://nodejs.org/ |
| **npm** | 6.x or higher | Included with Node.js |
| **MySQL** | 8.0 or higher | https://dev.mysql.com/downloads/ |
| **Git** | Latest | https://git-scm.com/ |

### Verify Installation

```bash
# Check Node.js version
node --version
# Should output: v14.x.x or higher

# Check npm version
npm --version
# Should output: 6.x.x or higher

# Check MySQL version
mysql --version
# Should output: mysql Ver 8.0.x

# Check Git version
git --version
# Should output: git version 2.x.x
```

---

## Clone Repository

### Step 1: Clone from GitHub

```bash
# Navigate to your desired directory
cd /path/to/your/projects

# Clone the repository
git clone https://github.com/yourusername/skynestwindsurf.git

# Navigate into project directory
cd skynestwindsurf
```

### Step 2: Verify Project Structure

```bash
# List contents
ls -la

# You should see:
# - backend/
# - frontend/
# - database/
# - README.md
# - etc.
```

---

## Database Setup

### Step 1: Start MySQL Server

**Windows:**
```bash
# Start MySQL service
net start MySQL80
```

**macOS/Linux:**
```bash
# Start MySQL service
sudo systemctl start mysql
# OR
sudo service mysql start
```

### Step 2: Login to MySQL

```bash
# Login as root
mysql -u root -p

# Enter your MySQL root password when prompted
```

### Step 3: Create Database and Import Schema

**Option A: Using MySQL Command Line (Recommended)**

```bash
# Exit MySQL if you're in it
exit

# Navigate to database directory
cd database

# Import schema (creates database and tables)
mysql -u root -p < schema.sql

# Import seed data
mysql -u root -p < seed_data.sql

# Import stored procedures
mysql -u root -p < procedures.sql

# Import triggers
mysql -u root -p < triggers.sql

# Import reports
mysql -u root -p < reports.sql

# Import efficiency improvements
mysql -u root -p < database_efficiency_improvements.sql
```

**Option B: Using MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Click **File** → **Open SQL Script**
4. Navigate to `database/` folder
5. Open and execute files in this order:
   - `schema.sql`
   - `seed_data.sql`
   - `procedures.sql`
   - `triggers.sql`
   - `reports.sql`
   - `database_efficiency_improvements.sql`

### Step 4: Verify Database Creation

```bash
# Login to MySQL
mysql -u root -p

# Switch to database
USE skynest_hotels;

# Check tables
SHOW TABLES;

# You should see 15 tables:
# - hotel_branches
# - room_types
# - rooms
# - users
# - guests
# - bookings
# - service_catalogue
# - branch_services
# - service_usage
# - service_requests
# - payments
# - support_tickets
# - ticket_responses
# - audit_log
# - room_availability_cache

# Check procedures
SHOW PROCEDURE STATUS WHERE Db = 'skynest_hotels';

# Check triggers
SHOW TRIGGERS;

# Exit MySQL
exit
```

### Step 5: Generate Password Hashes (Optional)

If you need to create new users with hashed passwords:

```bash
# Navigate to database directory
cd database

# Run hash generator
node generate_hashes.js

# Copy the generated hashes for use in INSERT statements
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
# From project root
cd backend
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - express
# - mysql2
# - dotenv
# - cors
# - bcryptjs
# - jsonwebtoken
# - express-validator
# - morgan
# - helmet
```

**Expected Output:**
```
added 150+ packages in 30s
```

### Step 3: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
# Windows:
notepad .env

# macOS/Linux:
nano .env
# OR
vim .env
```

**Edit `.env` with your MySQL credentials:**

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=skynest_hotels
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Important:**
- Replace `your_mysql_password` with your actual MySQL root password
- Replace `your_super_secret_jwt_key_change_this_in_production` with a strong random string
- Keep `CORS_ORIGIN=http://localhost:5173` (Vite's default port)

### Step 4: Test Database Connection

```bash
# Start backend server
npm start

# You should see:
# Server running on port 5000
# Database connected successfully
```

**If you see connection errors, check:**
- MySQL is running
- Database credentials in `.env` are correct
- Database `skynest_hotels` exists

### Step 5: Stop Backend (for now)

```bash
# Press Ctrl+C to stop the server
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
# From project root
cd frontend
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - react
# - react-dom
# - react-router-dom
# - axios
# - react-icons
# - recharts
# - date-fns
# - react-toastify
# - vite
```

**Expected Output:**
```
added 200+ packages in 45s
```

### Step 3: Verify Configuration

The frontend is pre-configured to connect to `http://localhost:5000` for the backend API.

**Check `src/utils/api.js`:**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**No changes needed if:**
- Backend runs on port 5000
- Frontend runs on port 5173 (Vite default)

---

## Running the Application

### Step 1: Start Backend Server

**Open Terminal 1:**

```bash
# Navigate to backend
cd backend

# Start server
npm start

# Expected output:
# Server running on port 5000
# Database connected successfully
```

**Keep this terminal running!**

### Step 2: Start Frontend Development Server

**Open Terminal 2 (new terminal):**

```bash
# Navigate to frontend
cd frontend

# Start development server
npm run dev

# Expected output:
# VITE v4.x.x ready in xxx ms
# ➜ Local:   http://localhost:5173/
# ➜ Network: use --host to expose
```

**Keep this terminal running!**

### Step 3: Access Application

Open your web browser and navigate to:

```
http://localhost:5173
```

You should see the **SkyNest Hotels Login Page**!

---

## Verification

### Step 1: Test Login

**Admin Login:**
- Username: `admin`
- Password: `Admin@123`

**Expected:** Redirected to Admin Dashboard

**Receptionist Login:**
- Username: `receptionist1`
- Password: `Recep@123`

**Expected:** Redirected to Receptionist Dashboard

**Guest Login:**
- Username: `john.doe`
- Password: `Guest@123`

**Expected:** Redirected to Guest Dashboard

### Step 2: Test Basic Functionality

**As Admin:**
1. ✅ View Dashboard statistics
2. ✅ Navigate to Bookings page
3. ✅ Navigate to Rooms page
4. ✅ Navigate to Guests page
5. ✅ Navigate to Services page
6. ✅ Navigate to Reports page

**As Receptionist:**
1. ✅ View Dashboard
2. ✅ Create a new booking
3. ✅ View bookings (branch-filtered)
4. ✅ Process check-in
5. ✅ View service requests

**As Guest:**
1. ✅ View Dashboard
2. ✅ View My Bookings
3. ✅ Request Service
4. ✅ Contact Support

### Step 3: Check API Endpoints

**Test Backend API:**

```bash
# Test health check (in new terminal)
curl http://localhost:5000/api/health

# Expected: {"status":"ok","message":"Server is running"}

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Expected: JSON with token and user data
```

---

## Troubleshooting

### Issue 1: Database Connection Failed

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Check MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   
   # macOS/Linux
   sudo systemctl status mysql
   ```

2. Verify credentials in `backend/.env`

3. Check MySQL port (default 3306):
   ```bash
   mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
   ```

### Issue 2: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

**Option A: Kill process using port**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**Option B: Change port**
```bash
# Edit backend/.env
PORT=5001

# Update frontend/src/utils/api.js
const API_BASE_URL = 'http://localhost:5001/api';
```

### Issue 3: npm install fails

**Error:**
```
npm ERR! code EACCES
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If still fails, use sudo (macOS/Linux only)
sudo npm install
```

### Issue 4: Frontend shows blank page

**Solutions:**

1. **Check browser console** (F12)
   - Look for errors
   - Check if API calls are failing

2. **Verify backend is running**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files

4. **Hard refresh**
   - Press Ctrl+Shift+R (Windows/Linux)
   - Press Cmd+Shift+R (macOS)

### Issue 5: CORS errors

**Error in browser console:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

Check `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

Restart backend server after changes.

### Issue 6: JWT token errors

**Error:**
```
JsonWebTokenError: invalid signature
```

**Solution:**

1. Clear browser localStorage:
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   ```

2. Login again

3. Check `JWT_SECRET` in `backend/.env` is set

### Issue 7: Database tables not created

**Solution:**

```bash
# Re-run schema
mysql -u root -p skynest_hotels < database/schema.sql

# Check tables
mysql -u root -p -e "USE skynest_hotels; SHOW TABLES;"
```

### Issue 8: Seed data not inserted

**Solution:**

```bash
# Re-run seed data
mysql -u root -p skynest_hotels < database/seed_data.sql

# Verify data
mysql -u root -p -e "USE skynest_hotels; SELECT * FROM users;"
```

---

## Development Mode vs Production

### Development (Current Setup)

**Backend:**
```bash
npm start  # Uses node server.js
```

**Frontend:**
```bash
npm run dev  # Vite dev server with hot reload
```

### Production Build

**Backend:**
```bash
# Same as development
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start server.js --name skynest-backend
```

**Frontend:**
```bash
# Build for production
npm run build

# Output in dist/ folder
# Serve with nginx or apache
```

---

## Quick Reference

### Start Everything

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Stop Everything

```bash
# In each terminal, press:
Ctrl + C
```

### Restart Database

```bash
# Windows
net stop MySQL80
net start MySQL80

# macOS/Linux
sudo systemctl restart mysql
```

### Reset Database

```bash
# WARNING: This deletes all data!
mysql -u root -p -e "DROP DATABASE skynest_hotels;"
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed_data.sql
mysql -u root -p < database/procedures.sql
mysql -u root -p < database/triggers.sql
mysql -u root -p < database/reports.sql
mysql -u root -p < database/database_efficiency_improvements.sql
```

---

## Next Steps

After successful installation:

1. ✅ Read [STYLING_GUIDE.md](./STYLING_GUIDE.md) to customize the UI
2. ✅ Read [DATABASE_TABLES.md](./DATABASE_TABLES.md) to understand the database
3. ✅ Check [README.md](./README.md) for API documentation
4. ✅ Review [CICD_GUIDE.md](./CICD_GUIDE.md) for deployment

---

## Support

If you encounter issues not covered here:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages carefully
3. Check browser console (F12) for frontend errors
4. Check terminal output for backend errors
5. Create an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, MySQL version)

---

**🎉 Congratulations! Your SkyNest Hotels system is now running!**
