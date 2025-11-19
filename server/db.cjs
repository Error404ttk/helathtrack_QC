const mysql = require('mysql2');

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: 'localhost',      // Database Host (e.g., 'localhost' or IP)
  port: 3306,       // Database Port (Default: 3306)
  user: 'your_username',      // Database User
  password: 'your_password',  // Database Password
  database: 'your_database', // Database Name
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Export promise-based pool
module.exports = pool.promise();