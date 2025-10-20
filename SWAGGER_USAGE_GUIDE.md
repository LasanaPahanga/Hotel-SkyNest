# Swagger API Documentation Usage Guide

## How to Use Swagger UI

### Step 1: Access Swagger
Open your browser and go to:
```
http://localhost:5000/api-docs
```

### Step 2: Authenticate

**1. Login to get a token:**
- Find the **Authentication** section
- Click on `POST /api/auth/login`
- Click "Try it out"
- Enter credentials:
  ```json
  {
    "email": "admin@skynest.lk",
    "password": "admin123"
  }
  ```
- Click "Execute"
- Copy the `token` from the response

**2. Authorize Swagger:**
- Click the **"Authorize"** button at the top right (🔒 lock icon)
- In the popup, enter: `Bearer <paste-your-token-here>`
  - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Click "Authorize"
- Click "Close"

### Step 3: Use Protected APIs

Now you can use all protected APIs:
- ✅ Bookings
- ✅ Rooms
- ✅ Guests
- ✅ Services
- ✅ Payments
- ✅ Reports
- ✅ Users

Just click on any endpoint, click "Try it out", fill in the parameters, and click "Execute".

## Test Credentials

### Admin Account
```
Email: admin@skynest.lk
Password: admin123
```

### Receptionist Account
```
Email: receptionist@skynest.lk
Password: receptionist123
```

### Guest Account
```
Email: john.smith@email.com
Password: guest123
```

## Common Issues

### Issue 1: APIs Return 401 Unauthorized
**Solution:** You need to authenticate first (see Step 2 above)

### Issue 2: Token Expired
**Solution:** Login again to get a new token and re-authorize

### Issue 3: 403 Forbidden
**Solution:** You're trying to access an endpoint that requires higher permissions. Login with an Admin account.

## API Categories

### 🔓 Public APIs (No Auth Required)
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Guest signup
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email/{token}` - Verify email

### 🔒 Protected APIs (Auth Required)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- All Booking endpoints
- All Room endpoints
- All Guest endpoints
- All Service endpoints
- All Payment endpoints
- All Report endpoints

### 👑 Admin Only APIs
- `POST /api/auth/register` - Register new user
- User management endpoints
- Branch management endpoints
- System configuration endpoints

## Token Format

When authorizing, always use this format:
```
Bearer <your-token>
```

**Correct:**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2OTc3MDAwMDAsImV4cCI6MTY5NzcwMzYwMH0.abc123
```

**Incorrect:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ❌ (missing "Bearer ")
Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ❌ (has colon)
```

## Quick Test Flow

### Test Booking Creation
1. Authorize with admin credentials
2. Go to `GET /api/rooms/available`
3. Try it out with dates
4. Copy a room_id from response
5. Go to `POST /api/bookings`
6. Create a booking with that room_id
7. Check `GET /api/bookings` to see your booking

### Test Payment Processing
1. Create a booking (see above)
2. Go to `POST /api/payments`
3. Add payment for the booking
4. Check `GET /api/payments` to see payment

### Test Reports
1. Authorize with admin credentials
2. Go to `GET /api/reports/occupancy`
3. Set date range
4. Execute to see occupancy report

## Tips

### 💡 Tip 1: Keep Token Handy
Copy your token to a text file so you can re-authorize quickly if needed.

### 💡 Tip 2: Check Response Codes
- **200** = Success
- **201** = Created successfully
- **400** = Bad request (check your input)
- **401** = Not authenticated (need to authorize)
- **403** = Forbidden (need higher permissions)
- **404** = Not found
- **500** = Server error (check backend logs)

### 💡 Tip 3: Use Examples
Most endpoints have example request bodies. Click "Try it out" to see them.

### 💡 Tip 4: Check Backend Logs
If something doesn't work, check your backend terminal for error messages.

## Why Other APIs Don't Show Documentation

Currently, only the Authentication endpoints have full Swagger documentation. Other endpoints work perfectly but don't have Swagger docs yet.

**They still work!** You just need to:
1. Know the endpoint URL
2. Authorize with a token
3. Send the correct request body

The APIs are fully functional - they just need documentation to be added.

## Adding Swagger Docs (For Developers)

To add Swagger documentation to other routes, add JSDoc comments like this:

```javascript
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/', verifyToken, getAllBookings);
```

## Summary

✅ **Auth APIs work** - Fully documented in Swagger
✅ **Other APIs work** - Just need to authorize first
✅ **All endpoints functional** - Documentation is optional
✅ **Token-based auth** - Use Bearer token format

---

**Happy Testing!** 🚀

For issues, check:
1. Backend terminal for errors
2. Browser console for frontend errors
3. Network tab for API responses
