import { format, parseISO, differenceInDays } from 'date-fns';

// Format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2
    }).format(amount);
};

// Format date
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
    if (!date) return '-';
    try {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        return format(parsedDate, formatStr);
    } catch (error) {
        return '-';
    }
};

// Format datetime
export const formatDateTime = (date) => {
    return formatDate(date, 'MMM dd, yyyy HH:mm');
};

// Calculate nights between dates
export const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    try {
        const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
        const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
        return differenceInDays(end, start);
    } catch (error) {
        return 0;
    }
};

// Get status badge class
export const getStatusClass = (status) => {
    const statusClasses = {
        'Booked': 'status-booked',
        'Checked-In': 'status-checked-in',
        'Checked-Out': 'status-checked-out',
        'Cancelled': 'status-cancelled',
        'Available': 'status-available',
        'Occupied': 'status-occupied',
        'Maintenance': 'status-maintenance',
        'Reserved': 'status-reserved',
        'Completed': 'status-completed',
        'Pending': 'status-pending',
        'Failed': 'status-failed',
        'Refunded': 'status-refunded',
        'PAID': 'status-paid',
        'UNPAID': 'status-unpaid'
    };
    return statusClasses[status] || 'status-default';
};

// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Get role display name
export const getRoleDisplayName = (role) => {
    const roleNames = {
        'Admin': 'Administrator',
        'Receptionist': 'Receptionist',
        'Guest': 'Guest'
    };
    return roleNames[role] || role;
};

// Get dashboard route by role
export const getDashboardRoute = (role) => {
    const routes = {
        'Admin': '/admin',
        'Receptionist': '/receptionist',
        'Guest': '/guest'  // Guest dashboard (separate from bookings)
    };
    return routes[role] || '/';
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
};

// Group array by key
export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
};

// Debounce function
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Export to CSV
export const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
