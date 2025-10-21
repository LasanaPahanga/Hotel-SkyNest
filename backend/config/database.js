const mysql = require('mysql2');
require('dotenv').config();

// Railway uses MYSQL* variables, we use DB_* variables
// Support both formats
const config = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'skynest_hotels',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    charset: 'utf8mb4'
};

console.log('🔌 Attempting to connect to database:', {
    host: config.host,
    user: config.user,
    database: config.database,
    port: config.port
});

// Create connection pool
const pool = mysql.createPool(config);

// Get promise-based pool
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection
};
