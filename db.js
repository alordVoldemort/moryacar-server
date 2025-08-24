const mysql = require("mysql2");
require("dotenv").config();

// Log connection details (without exposing password)
console.log('🔗 Database Configuration:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? '***configured***' : '***empty***'
});

// Create connection pool for better connection management
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  connectionLimit: 10,          // Maximum number of connections
  acquireTimeout: 60000,        // Maximum time to get connection
  timeout: 60000,               // Maximum time for queries
  reconnect: true,              // Automatically reconnect
  idleTimeout: 300000,          // Close idle connections after 5 minutes
  maxIdle: 10,                  // Maximum idle connections
  enableKeepAlive: true,        // Keep connections alive
  keepAliveInitialDelay: 0,     // Initial delay for keep alive
});

// Enhanced error handling for pool
pool.on('connection', function (connection) {
  console.log('✅ Database pool connection established as ID', connection.threadId);
});

pool.on('error', function(err) {
  console.error('💥 Database Pool Error Code:', err.code);
  console.error('💥 Database Pool Error Message:', err.message);
  
  switch(err.code) {
    case 'PROTOCOL_CONNECTION_LOST':
      console.log('🔄 Pool connection lost, will automatically reconnect...');
      break;
    case 'ER_CON_COUNT_ERROR':
      console.error('🚫 Too many connections to database');
      break;
    case 'ECONNREFUSED':
      console.error('🔒 Connection refused - Check if database server is running');
      break;
    case 'ENOTFOUND':
      console.error('🌐 Host not found - Check your DB_HOST setting');
      break;
    case 'ER_ACCESS_DENIED_ERROR':
      console.error('🚫 Access denied - Check username/password');
      break;
    case 'ER_BAD_DB_ERROR':
      console.error('🗄️  Database does not exist - Check DB_NAME setting');
      break;
    case 'ETIMEDOUT':
      console.error('⏰ Connection timeout - Server not responding');
      break;
    default:
      console.error('❓ Unknown database error');
  }
});

// Test initial connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    return;
  }
  console.log('✅ Database pool connected successfully as ID', connection.threadId);
  connection.release(); // Return connection to pool
});

// Create a wrapper object that provides backward compatibility
const db = {
  query: (sql, params, callback) => {
    // Handle cases where params is actually the callback
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    pool.execute(sql, params || [], (err, results, fields) => {
      if (err) {
        console.error('💥 Database Query Error:', err.message);
        console.error('💥 SQL:', sql);
        console.error('💥 Params:', params);
      }
      callback(err, results, fields);
    });
  },
  
  // Direct access to pool for advanced usage
  pool: pool,
  
  // Graceful shutdown method
  end: () => {
    return new Promise((resolve) => {
      pool.end(() => {
        console.log('📴 Database pool closed');
        resolve();
      });
    });
  }
};

module.exports = db;
