const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Check if user has required role
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Check if user can access specific branch
const checkBranchAccess = (req, res, next) => {
    const requestedBranchId = parseInt(req.params.branchId || req.body.branch_id);
    
    // Admin can access all branches
    if (req.user.role === 'Admin') {
        return next();
    }

    // Receptionist can only access their assigned branch
    if (req.user.role === 'Receptionist') {
        if (req.user.branch_id !== requestedBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your assigned branch.'
            });
        }
    }

    next();
};

module.exports = {
    verifyToken,
    checkRole,
    checkBranchAccess
};
