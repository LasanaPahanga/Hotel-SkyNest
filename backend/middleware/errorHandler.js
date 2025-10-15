// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // MySQL specific errors
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = 'Duplicate entry. Record already exists.';
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = 'Referenced record does not exist.';
    }

    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        statusCode = 400;
        message = 'Cannot delete record. It is referenced by other records.';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 handler
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
};

module.exports = {
    errorHandler,
    notFound
};
