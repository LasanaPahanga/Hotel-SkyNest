# 🎨 Frontend Styling Guide

Complete guide to styling and customizing the SkyNest Hotels frontend without breaking functionality.

---

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [Styling Architecture](#styling-architecture)
3. [Page-by-Page Styling](#page-by-page-styling)
4. [Component Styling](#component-styling)
5. [Adding Custom Styles](#adding-custom-styles)
6. [Color Scheme](#color-scheme)
7. [Best Practices](#best-practices)
8. [Common Customizations](#common-customizations)

---

## Project Structure

```
frontend/src/
├── pages/                    # Page components
│   ├── dashboards/
│   │   ├── AdminDashboard.jsx
│   │   ├── GuestDashboard.jsx
│   │   └── ReceptionistDashboard.jsx
│   ├── guest/
│   │   ├── MyBookings.jsx
│   │   ├── BookingDetails.jsx
│   │   ├── RequestService.jsx
│   │   └── ContactSupport.jsx
│   ├── Bookings.jsx
│   ├── CreateBooking.jsx
│   ├── Guests.jsx
│   ├── Rooms.jsx
│   ├── Services.jsx
│   ├── ServiceRequests.jsx
│   ├── Payments.jsx
│   ├── Reports.jsx
│   ├── SupportTickets.jsx
│   ├── Users.jsx
│   ├── Login.jsx
│   └── NotFound.jsx
├── components/              # Reusable components
│   ├── Layout.jsx
│   ├── Card.jsx
│   ├── Modal.jsx
│   ├── LoadingSpinner.jsx
│   ├── StatCard.jsx
│   ├── Table.jsx
│   └── PrivateRoute.jsx
└── styles/                  # CSS files
    ├── App.css
    ├── Layout.css
    ├── Card.css
    ├── Modal.css
    ├── Login.css
    ├── AdminDashboard.css
    ├── GuestDashboard.css
    ├── ReceptionistDashboard.css
    ├── Bookings.css
    ├── BookingDetails.css
    ├── CreateBooking.css
    ├── Guests.css
    ├── Rooms.css
    ├── Payments.css
    └── Reports.css
```

---

## Styling Architecture

### Current Approach: CSS Modules + Inline Styles

**CSS Files:**
- Global styles in `App.css`
- Component-specific styles in dedicated CSS files
- Layout styles in `Layout.css`

**Inline Styles:**
- Used for dynamic styling
- Component-specific overrides
- Quick customizations

### Import Structure

```javascript
// In a page component
import React from 'react';
import Layout from '../components/Layout';
import '../styles/PageName.css';  // Page-specific styles
```

---

## Page-by-Page Styling

### 1. Login Page

**File:** `pages/Login.jsx`  
**CSS:** `styles/Login.css`

**Key Classes:**
```css
.login-container      /* Main container */
.login-card          /* Login form card */
.login-header        /* Header section */
.login-form          /* Form wrapper */
.form-group          /* Input group */
.login-button        /* Submit button */
.register-link       /* Register link */
```

**Customization Example:**

```css
/* In styles/Login.css */

/* Change background */
.login-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Change card style */
.login-card {
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Change button color */
.login-button {
    background: #667eea;
    border: none;
}

.login-button:hover {
    background: #5568d3;
}
```

**⚠️ Don't Change:**
- Form field `name` attributes
- `onSubmit` handlers
- Input `type` attributes

---

### 2. Admin Dashboard

**File:** `pages/dashboards/AdminDashboard.jsx`  
**CSS:** `styles/AdminDashboard.css`

**Key Classes:**
```css
.admin-dashboard      /* Main container */
.dashboard-header     /* Header section */
.stats-grid          /* Statistics cards grid */
.stat-card           /* Individual stat card */
.chart-container     /* Chart wrapper */
.recent-bookings     /* Recent bookings table */
```

**Customization Example:**

```css
/* In styles/AdminDashboard.css */

/* Change stat card colors */
.stat-card.revenue {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.bookings {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.occupancy {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* Adjust grid layout */
.stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

/* Style charts */
.chart-container {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**⚠️ Don't Change:**
- Data fetching logic
- State management
- API calls

---

### 3. Guest Dashboard

**File:** `pages/dashboards/GuestDashboard.jsx`  
**CSS:** `styles/GuestDashboard.css`

**Key Classes:**
```css
.guest-dashboard      /* Main container */
.welcome-section     /* Welcome banner */
.quick-actions       /* Action buttons */
.current-booking     /* Current booking card */
.booking-details     /* Booking info */
```

**Customization Example:**

```css
/* In styles/GuestDashboard.css */

/* Style welcome section */
.welcome-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 3rem;
    border-radius: 16px;
    margin-bottom: 2rem;
}

/* Style action buttons */
.quick-actions button {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s;
}

.quick-actions button:hover {
    background: #667eea;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}
```

---

### 4. Bookings Page

**File:** `pages/Bookings.jsx`  
**CSS:** `styles/Bookings.css`

**Key Classes:**
```css
.bookings-page       /* Main container */
.filters-section     /* Filter controls */
.bookings-table      /* Table wrapper */
.booking-row         /* Table row */
.status-badge        /* Status indicator */
.action-buttons      /* Action button group */
```

**Customization Example:**

```css
/* In styles/Bookings.css */

/* Style status badges */
.status-badge.booked {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
}

.status-badge.checked-in {
    background: #d1fae5;
    color: #065f46;
}

.status-badge.checked-out {
    background: #e5e7eb;
    color: #374151;
}

.status-badge.cancelled {
    background: #fee2e2;
    color: #991b1b;
}

/* Style table */
.bookings-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.bookings-table th {
    background: #f9fafb;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
}

.bookings-table td {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.bookings-table tr:hover {
    background: #f9fafb;
}
```

---

### 5. Rooms Page

**File:** `pages/Rooms.jsx`  
**CSS:** `styles/Rooms.css`

**Key Classes:**
```css
.rooms-page          /* Main container */
.room-grid           /* Room cards grid */
.room-card           /* Individual room card */
.room-status         /* Status indicator */
.room-details        /* Room information */
```

**Customization Example:**

```css
/* In styles/Rooms.css */

/* Grid layout */
.room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
}

/* Room card */
.room-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
}

.room-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Status colors */
.room-status.available {
    background: #10b981;
    color: white;
}

.room-status.occupied {
    background: #ef4444;
    color: white;
}

.room-status.maintenance {
    background: #f59e0b;
    color: white;
}

.room-status.reserved {
    background: #3b82f6;
    color: white;
}
```

---

## Component Styling

### Layout Component

**File:** `components/Layout.jsx`  
**CSS:** `styles/Layout.css`

**Key Classes:**
```css
.layout              /* Main layout wrapper */
.sidebar             /* Sidebar navigation */
.sidebar-header      /* Sidebar header */
.nav-item            /* Navigation item */
.nav-item.active     /* Active nav item */
.main-content        /* Content area */
.topbar              /* Top navigation bar */
```

**Customization Example:**

```css
/* In styles/Layout.css */

/* Sidebar styling */
.sidebar {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    width: 260px;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
    padding: 2rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
}

/* Navigation items */
.nav-item {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.3s;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

.nav-item.active {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    border-left: 4px solid #667eea;
}

/* Top bar */
.topbar {
    background: white;
    padding: 1rem 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
```

**⚠️ Don't Change:**
- Navigation links (`to` props)
- Logout functionality
- User authentication checks

---

### Card Component

**File:** `components/Card.jsx`  
**CSS:** `styles/Card.css`

**Key Classes:**
```css
.card                /* Card container */
.card-header         /* Card header */
.card-body           /* Card content */
.card-footer         /* Card footer */
```

**Customization Example:**

```css
/* In styles/Card.css */

.card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s;
}

.card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
}

.card-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
}

.card-body {
    padding: 1.5rem;
}

.card-footer {
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}
```

---

### Modal Component

**File:** `components/Modal.jsx`  
**CSS:** `styles/Modal.css`

**Key Classes:**
```css
.modal-overlay       /* Background overlay */
.modal-container     /* Modal wrapper */
.modal-header        /* Modal header */
.modal-body          /* Modal content */
.modal-footer        /* Modal footer */
.modal-close         /* Close button */
```

**Customization Example:**

```css
/* In styles/Modal.css */

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-container {
    background: white;
    border-radius: 20px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    transition: color 0.3s;
}

.modal-close:hover {
    color: #ef4444;
}
```

**⚠️ Don't Change:**
- `isOpen` prop logic
- `onClose` handler
- Portal rendering

---

## Adding Custom Styles

### Method 1: Edit Existing CSS Files

**Safe to modify:**
- Colors
- Fonts
- Spacing (padding, margin)
- Borders
- Shadows
- Animations
- Hover effects

**Example:**

```css
/* In styles/Bookings.css */

/* Add new custom class */
.booking-card-premium {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    border: 2px solid #ffd700;
}

/* Modify existing class */
.bookings-table {
    font-family: 'Inter', sans-serif;  /* Change font */
    font-size: 0.95rem;                /* Adjust size */
}
```

### Method 2: Add Inline Styles

**In JSX:**

```javascript
<div style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
    borderRadius: '16px',
    color: 'white'
}}>
    Custom styled content
</div>
```

**⚠️ Best Practice:** Use inline styles for:
- Dynamic values
- Component-specific overrides
- Quick prototyping

### Method 3: Create New CSS File

**For new features:**

1. Create new CSS file in `styles/`
2. Import in component
3. Use unique class names

```css
/* styles/MyNewFeature.css */
.my-feature-container {
    /* Your styles */
}
```

```javascript
// In component
import '../styles/MyNewFeature.css';
```

---

## Color Scheme

### Current Color Palette

```css
/* Primary Colors */
--primary: #667eea;
--primary-dark: #5568d3;
--primary-light: #8b9bef;

/* Secondary Colors */
--secondary: #764ba2;
--secondary-dark: #5d3a81;
--secondary-light: #9566c3;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* Background */
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--bg-dark: #1e293b;
```

### Changing Color Scheme

**Option 1: CSS Variables (Recommended)**

```css
/* In styles/App.css */
:root {
    --primary: #your-color;
    --secondary: #your-color;
    /* etc. */
}
```

**Option 2: Find and Replace**

Search for color codes in CSS files and replace:
- `#667eea` → Your primary color
- `#764ba2` → Your secondary color

---

## Best Practices

### ✅ DO:

1. **Use Existing Classes First**
   ```css
   /* Extend existing classes */
   .bookings-table.custom {
       /* Your additions */
   }
   ```

2. **Add Comments**
   ```css
   /* Custom styling for premium bookings */
   .booking-premium {
       background: gold;
   }
   ```

3. **Use Consistent Naming**
   ```css
   .component-name-element
   .bookings-table-row
   .modal-header-title
   ```

4. **Test Responsiveness**
   ```css
   @media (max-width: 768px) {
       .bookings-table {
           font-size: 0.875rem;
       }
   }
   ```

5. **Maintain Accessibility**
   ```css
   button:focus {
       outline: 2px solid #667eea;
       outline-offset: 2px;
   }
   ```

### ❌ DON'T:

1. **Don't Remove Functional Classes**
   ```javascript
   // DON'T remove classes that control behavior
   <button className="btn btn-primary">  // Keep both
   ```

2. **Don't Override Critical Styles**
   ```css
   /* DON'T do this */
   * {
       display: none !important;  /* Breaks everything */
   }
   ```

3. **Don't Use !important Excessively**
   ```css
   /* Avoid */
   .my-class {
       color: red !important;  /* Hard to override later */
   }
   ```

4. **Don't Modify Component Logic**
   ```javascript
   // DON'T change
   onClick={handleSubmit}  // Keep handlers
   onChange={handleChange}
   ```

5. **Don't Delete CSS Files**
   - Keep all existing CSS files
   - Comment out instead of deleting

---

## Common Customizations

### 1. Change Primary Color

```css
/* In styles/App.css */
:root {
    --primary: #your-color;
}

/* Update gradients */
.gradient-primary {
    background: linear-gradient(135deg, #your-color 0%, #your-dark-color 100%);
}
```

### 2. Change Font

```css
/* In styles/App.css */
@import url('https://fonts.googleapis.com/css2?family=Your+Font&display=swap');

body {
    font-family: 'Your Font', sans-serif;
}
```

### 3. Add Dark Mode

```css
/* In styles/App.css */
body.dark-mode {
    background: #1f2937;
    color: #f9fafb;
}

body.dark-mode .card {
    background: #374151;
    color: #f9fafb;
}
```

### 4. Customize Buttons

```css
/* In styles/App.css */
.btn {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}
```

### 5. Add Animations

```css
/* In styles/App.css */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}
```

---

## Reference Image Example

### Before Customization:
```
┌─────────────────────────────────────┐
│  SkyNest Hotels - Login             │
│  ┌───────────────────────────────┐  │
│  │  Username: [____________]     │  │
│  │  Password: [____________]     │  │
│  │  [      Login      ]          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### After Customization:
```
┌─────────────────────────────────────┐
│  🏨 SkyNest Hotels                  │
│  ┌───────────────────────────────┐  │
│  │  👤 Username                  │  │
│  │  [____________]               │  │
│  │  🔒 Password                  │  │
│  │  [____________]               │  │
│  │  ┌─────────────────┐          │  │
│  │  │   🚀 Login      │          │  │
│  │  └─────────────────┘          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Changes Made:**
1. Added emoji icons
2. Rounded button corners
3. Added gradient background
4. Improved spacing

---

## Summary

### Safe to Modify:
- ✅ Colors
- ✅ Fonts
- ✅ Spacing
- ✅ Borders
- ✅ Shadows
- ✅ Animations
- ✅ Background images
- ✅ Icon sizes

### Don't Modify:
- ❌ Component logic
- ❌ Event handlers
- ❌ State management
- ❌ API calls
- ❌ Routing
- ❌ Authentication
- ❌ Data fetching

---

**Happy Styling! 🎨**
