const pool = require("../config/db");
const axios = require("axios");
const sql = require('mssql');


//........

exports.getServiceList = async (req, res) => {
  const { serviceId } = req.params; // Get serviceId from URL params instead of query params
  try {
    console.log("getServiceList  api calling ////")
    console.log("Fetching service data...");

    const poolConnection = await pool;

    // Create a request object from the pool connection
    const request = poolConnection.request();

    // Only add input for serviceId if it's provided
    if (serviceId) {
      request.input("ServiceId", sql.Int, serviceId);
    }

    // Execute the stored procedure
    const result = await request.execute("GetRechSrvList");
    console.log("Service list retrieved with serviceId:", serviceId);
     const data1 = result.recordset
    // Send the result as JSON
    res.status(200).send(
      
      data1
     
    );
  } catch (error) {
    console.error("Database error:", error);

    // Send error response
    res.status(200).json({
      result: false,
      data: "",
      message: "Database error occurred",
    });
  }
};