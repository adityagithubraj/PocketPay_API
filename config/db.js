const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  pool: {
    max: 5000,            // Maximum pool size
    min: 0,
    idleTimeoutMillis: 30000,  // Close idle connections after 30s
  },
  options: {
    encrypt: true,         // Use encryption if needed (based on your SQL Server configuration)
    trustServerCertificate: true, // Use if you're working with a self-signed certificate
  },
  connectionTimeout: 7000,  // Connection timeout of 1000ms
};

const pool = new sql.ConnectionPool(config);

pool.connect().then(() => {
  console.log('Connected to SQL Server');
}).catch(err => {
  console.error('SQL Server connection error: ', err);
});
module.exports = pool;

