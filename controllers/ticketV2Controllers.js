const sql = require("mssql");
const pool = require("../config/db");
const cron = require("node-cron");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require("path");


const { sendSignupSms } = require("../controllers/smsControllers");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const username = process.env.USERNAME2;
const token = process.env.PDRS_TOKEN;


exports.getTicketList = async (req, res) => {
    
    console.log("get ticket API calling now V2")
  try {
    const {
      MinDate = '',
      MaxDate = '',
      TicketNo = '',
      TicketType = 0,
      isParent = 0,
      status = 0,
      SenderId = '',
      Userid = '',
      Subj = '',
      Msg = ''
    } = req.body;

    const poolConnection = await pool;

    const request = poolConnection.request();
    request.input("MinDate", sql.VarChar(50), MinDate);
    request.input("MaxDate", sql.VarChar(50), MaxDate);
    request.input("TicketNo", sql.VarChar(50), TicketNo);
    request.input("TicketType", sql.Int, TicketType);
    request.input("isParent", sql.Int, isParent);
    request.input("status", sql.Int, status);
    request.input("SenderId", sql.VarChar(50), SenderId);
    request.input("Userid", sql.VarChar(50), Userid);
    request.input("Subj", sql.NVarChar(sql.MAX), Subj);
    request.input("Msg", sql.NVarChar(sql.MAX), Msg);

    const result = await request.execute("GetTicketList");

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error executing GetTicketList procedure:", error);
    res.status(200).json({
      success: false,
      message: "Error fetching ticket list",
      error: error.message,
    });
  }
};



//-------------THIS  FUNCTION FOR  POST DATA .----------------------//

exports.postTicket = async (req, res) => {
  console.log("postTicket API called............");

  try {
    const {
      TicketNo = "",
      TicketType = 0,
      SenderId = "",
      ReceiverId = "",
      Subj = "",
      Msg = "",
      isretailer = 0,
    //   ImgName = "",
    } = req.body;


    const ImgName = req.file ? path.join( req.file.filename) : null;
    console.log("Attachment path:", ImgName);

    const poolConnection = await pool;

    const request = poolConnection.request();
    request.input("TicketNo", sql.VarChar(50), TicketNo);
    request.input("TicketType", sql.Int, TicketType);
    request.input("SenderId", sql.VarChar(50), SenderId);
    request.input("ReceiverId", sql.VarChar(50), ReceiverId);
    request.input("Subj", sql.NVarChar(sql.MAX), Subj);
    request.input("Msg", sql.NVarChar(sql.MAX), Msg);
    request.input("isretailer", sql.Int, isretailer);
    request.input("ImgName", sql.NVarChar(100), ImgName);

    // Output parameter for result
    request.output("strResult", sql.VarChar(500));

    // Execute the stored procedure
    const result = await request.execute("AddTicket");

    // Get the result from the output parameter
    const strResult = result.output.strResult;

    if (strResult === "1") {
      res.status(200).json({
        success: true,
        message: "Ticket added or updated successfully",
      });
    } else {
      res.status(200).json({
        success: false,
        message: "Failed to add or update ticket",
        error: strResult,
      });
    }
  } catch (error) {
    console.error("Error executing AddTicket procedure:", error);

    res.status(500).json({
      success: false,
      message: "An error occurred while processing the ticket",
      error: error.message,
    });
  }
};

