const sql = require('mssql');
const pool = require('../config/db');
const cron = require('node-cron');
const { sendSignupSms }  = require('../controllers/smsControllers')

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const axios = require("axios");
const path = require('path');
require('dotenv').config();




//................ROLE FUNCTION ..........................//

exports.bindRole = async (req, res) => {
    try {

        //const pool = await sql.connect(config);

        const poolConnection = await pool;
        // Call the stored procedure with 'Id' as input
        const result = await poolConnection.request()


       // const result = await pool.request()
        .query("SELECT UserVal, Item_Desc FROM item_collection WHERE ItemId=6");
        
        res.json(result.recordset);
    } catch (error) {
        res.status(200).send("Error binding roles: " + error.message);
    }
  };

  //..........ADD ROLE FUNCTION ..........................//
  exports.addUserRole = async (req, res) => {
    try {
      const { UserVal, Item_Desc } = req.body;
  
      if (!UserVal || !Item_Desc) {
        return res.status(200).send("Both UserVal and Item_Desc are required.");
      }
      const poolConnection = await pool;
  
      const result = await poolConnection.request()
        .input("UserVal", sql.NVarChar(100), UserVal)
        .input("Item_Desc", sql.NVarChar(255), Item_Desc)
        .query("INSERT INTO item_collection (UserVal, Item_Desc, ItemId) VALUES (@UserVal, @Item_Desc, 6)");
  
      res.status(200).json({
        message: "New user added successfully",
        affectedRows: result.rowsAffected[0],
      });
    } catch (error) {
      res.status(200).send("Error adding user: " + error.message);
    }
  };

  
  //..............REGION  FUNCTION ............................//
  
  exports.bindRegion = async (req, res) => {
    try {

        const poolConnection = await pool;
        // Call the stored procedure with 'Id' as input
        const result = await poolConnection.request()
        
        .query("SELECT RID, Region FROM RegionMst WHERE Isactive=1");
        
        res.json(result.recordset);
    } catch (error) {
        res.status(200).send("Error binding regions: " + error.message);
    }
  };
  
  
  //..................STATE FUNCTION ........................//
  
  exports.bindState = async (req, res) => {
    try {
        const poolConnection = await pool;
       
        const result = await poolConnection.request()
        .execute("GetState");
        
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send("Error binding states: " + error.message);
    }
  };
  
  
  