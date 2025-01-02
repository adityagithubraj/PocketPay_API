const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; 
const sql = require('mssql');
const pool = require('../config/db');

const chakeAdminLock = async (req, res, next) => {
  let token = req.headers['authorization'];

  // Check if the token is provided
  if (!token) {
    return res.status(200).json({
      result: false,
      data: '',
      message: 'Access denied. No token provided.',
      tokenValid: false
    });
  }

  // Remove quotes from the token, if present
  token = token.replace(/"/g, '');
  console.log("Received token:", token);

  try {
    // Verify the token and extract the username
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token:", decoded);
    
    const username = decoded.username; // Ensure the token includes a 'username' field
    if (!username) {
      return res.status(200).json({
        result: false,
        data: '',
        message: 'Invalid token: username not found.',
        tokenValid: false
      });
    }

    // Get a database connection
    const poolConnection = await pool;
    const result = await poolConnection.request()
      .input('username', sql.NVarChar, username)
      .query(
        'SELECT srno AS UId, mobileno AS mobile, password, name, username AS userRole, lock FROM controlmst WHERE username = @username'
      );

    console.log("Query result length:", result.recordset.length);

    // Check if user exists
    if (result.recordset.length === 0) {
      return res.status(200).json({
        result: false,
        data: '',
        message: 'User not found.',
        tokenValid: false
      });
    }

    const user = result.recordset[0];
    console.log("User data:", user);

    // Check if the account is locked
    if (user.lock === 1) {
      return res.status(200).json({
        result: false,
        data: '', 
        message: 'You are locked by the admin.',
        tokenValid: true
      });
    }

    // Attach user information to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in chakeAdminLock middleware:", error);
    return res.status(200).json({
      result: false,
      data: '',
      message: 'Invalid token.',
      tokenValid: false
    });
  }
};

module.exports = chakeAdminLock;
 