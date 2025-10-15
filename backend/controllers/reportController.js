const { promisePool } = require('../config/database');

// @desc    Get room occupancy report
// @route   GET /api/reports/occupancy
// @access  Private
const getRoomOccupancyReport = async (req, res, next) => {
    try {
        const { start_date, end_date, branch_id } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide start_date and end_date'
            });
        }
        
        // Call stored procedure
        const [results] = await promisePool.query(
            'CALL get_room_occupancy_report(?, ?, ?)',
            [start_date, end_date, branch_id || null]
        );
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get guest billing summary
// @route   GET /api/reports/billing
// @access  Private
const getBillingReport = async (req, res, next) => {
    try {
        const [results] = await promisePool.query(
            'SELECT * FROM guest_billing_summary ORDER BY booking_date DESC'
        );
        
        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unpaid bookings report
// @route   GET /api/reports/unpaid
// @access  Private
const getUnpaidBookingsReport = async (req, res, next) => {
    try {
        const [results] = await promisePool.query('CALL get_unpaid_bookings_report()');
        
        res.json({
            success: true,
            count: results[0].length,
            data: results[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get service usage breakdown
// @route   GET /api/reports/services
// @access  Private
const getServiceUsageReport = async (req, res, next) => {
    try {
        const { branch_id, service_category } = req.query;
        
        let query = 'SELECT * FROM service_usage_breakdown WHERE 1=1';
        const params = [];
        
        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }
        
        if (service_category) {
            query += ' AND service_category = ?';
            params.push(service_category);
        }
        
        query += ' ORDER BY usage_date DESC';
        
        const [results] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get revenue report (branch-specific for receptionists)
// @route   GET /api/reports/revenue
// @access  Private
const getRevenueReport = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide start_date and end_date'
            });
        }
        
        // Determine branch filter
        const branchId = userRole === 'Receptionist' ? userBranchId : null;
        
        const [results] = await promisePool.query(
            'CALL get_branch_revenue_report(?, ?, ?)',
            [branchId, start_date, end_date]
        );
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get monthly revenue by branch
// @route   GET /api/reports/monthly-revenue
// @access  Private (Admin)
const getMonthlyRevenueReport = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        
        let query = 'SELECT * FROM monthly_revenue_by_branch WHERE 1=1';
        const params = [];
        
        if (year) {
            query += ' AND year = ?';
            params.push(year);
        }
        
        if (month) {
            query += ' AND month = ?';
            params.push(month);
        }
        
        query += ' ORDER BY year DESC, month DESC, branch_name';
        
        const [results] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get top services report (branch-specific for receptionists)
// @route   GET /api/reports/top-services
// @access  Private
const getTopServicesReport = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        // Determine branch filter
        const branchId = userRole === 'Receptionist' ? userBranchId : null;
        
        if (start_date && end_date) {
            const [results] = await promisePool.query(
                'CALL get_branch_top_services(?, ?, ?)',
                [branchId, start_date, end_date]
            );
            
            return res.json({
                success: true,
                data: results[0]
            });
        }
        
        // Use view for all-time data with branch filter
        let query = 'SELECT * FROM branch_top_services WHERE 1=1';
        const params = [];
        
        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        
        query += ' ORDER BY total_revenue DESC LIMIT 20';
        
        const [results] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
    try {
        const { branch_id } = req.query;
        
        // Total bookings
        let bookingsQuery = 'SELECT COUNT(*) as total FROM bookings WHERE 1=1';
        const bookingsParams = [];
        
        if (req.user.role === 'Receptionist') {
            bookingsQuery += ' AND branch_id = ?';
            bookingsParams.push(req.user.branch_id);
        } else if (branch_id) {
            bookingsQuery += ' AND branch_id = ?';
            bookingsParams.push(branch_id);
        }
        
        const [totalBookings] = await promisePool.query(bookingsQuery, bookingsParams);
        
        // Current check-ins
        let checkedInQuery = `SELECT COUNT(*) as total FROM bookings 
                              WHERE booking_status = 'Checked-In'`;
        const checkedInParams = [];
        
        if (req.user.role === 'Receptionist') {
            checkedInQuery += ' AND branch_id = ?';
            checkedInParams.push(req.user.branch_id);
        } else if (branch_id) {
            checkedInQuery += ' AND branch_id = ?';
            checkedInParams.push(branch_id);
        }
        
        const [checkedIn] = await promisePool.query(checkedInQuery, checkedInParams);
        
        // Available rooms
        let availableQuery = `SELECT COUNT(*) as total FROM rooms 
                              WHERE status = 'Available'`;
        const availableParams = [];
        
        if (req.user.role === 'Receptionist') {
            availableQuery += ' AND branch_id = ?';
            availableParams.push(req.user.branch_id);
        } else if (branch_id) {
            availableQuery += ' AND branch_id = ?';
            availableParams.push(branch_id);
        }
        
        const [availableRooms] = await promisePool.query(availableQuery, availableParams);
        
        // Total revenue (current month)
        let revenueQuery = `
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(paid_amount), 0) as collected_revenue,
                COALESCE(SUM(outstanding_amount), 0) as pending_revenue
            FROM bookings
            WHERE MONTH(booking_date) = MONTH(CURRENT_DATE())
            AND YEAR(booking_date) = YEAR(CURRENT_DATE())
            AND booking_status != 'Cancelled'
        `;
        const revenueParams = [];
        
        if (req.user.role === 'Receptionist') {
            revenueQuery += ' AND branch_id = ?';
            revenueParams.push(req.user.branch_id);
        } else if (branch_id) {
            revenueQuery += ' AND branch_id = ?';
            revenueParams.push(branch_id);
        }
        
        const [revenue] = await promisePool.query(revenueQuery, revenueParams);
        
        // Today's check-ins and check-outs
        let todayQuery = `
            SELECT 
                COUNT(CASE WHEN check_in_date = CURRENT_DATE() THEN 1 END) as today_checkins,
                COUNT(CASE WHEN check_out_date = CURRENT_DATE() THEN 1 END) as today_checkouts
            FROM bookings
            WHERE booking_status IN ('Booked', 'Checked-In')
        `;
        const todayParams = [];
        
        if (req.user.role === 'Receptionist') {
            todayQuery += ' AND branch_id = ?';
            todayParams.push(req.user.branch_id);
        } else if (branch_id) {
            todayQuery += ' AND branch_id = ?';
            todayParams.push(branch_id);
        }
        
        const [today] = await promisePool.query(todayQuery, todayParams);
        
        // Occupancy rate
        let occupancyQuery = `
            SELECT 
                COUNT(*) as total_rooms,
                SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied_rooms
            FROM rooms
        `;
        const occupancyParams = [];
        
        if (req.user.role === 'Receptionist') {
            occupancyQuery += ' WHERE branch_id = ?';
            occupancyParams.push(req.user.branch_id);
        } else if (branch_id) {
            occupancyQuery += ' WHERE branch_id = ?';
            occupancyParams.push(branch_id);
        }
        
        const [occupancy] = await promisePool.query(occupancyQuery, occupancyParams);
        
        const occupancyRate = occupancy[0].total_rooms > 0 
            ? (occupancy[0].occupied_rooms / occupancy[0].total_rooms * 100).toFixed(2)
            : 0;
        
        res.json({
            success: true,
            data: {
                total_bookings: totalBookings[0].total,
                current_checkins: checkedIn[0].total,
                available_rooms: availableRooms[0].total,
                total_rooms: occupancy[0].total_rooms,
                occupied_rooms: occupancy[0].occupied_rooms,
                occupancy_rate: parseFloat(occupancyRate),
                today_checkins: today[0].today_checkins,
                today_checkouts: today[0].today_checkouts,
                monthly_revenue: {
                    total: parseFloat(revenue[0].total_revenue),
                    collected: parseFloat(revenue[0].collected_revenue),
                    pending: parseFloat(revenue[0].pending_revenue)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get guest history
// @route   GET /api/reports/guest-history/:guestId
// @access  Private
const getGuestHistory = async (req, res, next) => {
    try {
        const [results] = await promisePool.query(
            'CALL get_guest_history(?)',
            [req.params.guestId]
        );
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRoomOccupancyReport,
    getBillingReport,
    getUnpaidBookingsReport,
    getServiceUsageReport,
    getRevenueReport,
    getMonthlyRevenueReport,
    getTopServicesReport,
    getDashboardStats,
    getGuestHistory
};
