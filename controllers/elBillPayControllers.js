const axios = require('axios');
require("dotenv").config();
const pool = require("../config/db");
const sql = require("mssql");


const username =process.env.USERNAME2;
const token =process.env.PDRS_TOKEN;
const password = process.env.PDRS_PASSWORD;

exports.fetchBill = async (req, res) => {
  const { mcode, service_no, customerMobile, option1 = '', option2 = '' } = req.body;
  
  try {
   
    const url  ='https://pdrs.online/webapi/FetchBill';
    const headers = {
      'Content-Type': 'application/json',
      'Username': '8093073099',  
      'Token': '617301924407158903058226494669' 
    };
    
    const body = { mcode, service_no, customerMobile, option1, option2 };


    // Make API call
    const response = await axios.post(url, body, { headers });
        
    if (response.data.statuscode === 'TXN') {
      return res.status(200).json({ result: true, data: response.data.particulars, message: 'Bill fetched successfully',  tokenValid: true });
    } else {
      return res.status(200).json({ result: false, data: '', message: response.data.message || 'Error fetching bill' , tokenValid: true});
    }
  } catch (error) {
    console.error('FetchBill API error:', error);
    return res.status(200).json({ result: false, data: '', message: 'Internal server error',  tokenValid: true });
  }
};


//..............validate function 

  exports.validateBill = async (req, res) => {
    const { mcode, service_no, customerMobile, option1 = '', option2 = '' } = req.body;

    console.log("Bill validation ",req.body);
    
    try {
      const url = 'https://pdrs.online/webapi/ValidateBill';
              
      const headers = {
        'Content-Type': 'application/json',
        'Username': '8093073099', 
        'Token': '617301924407158903058226494669' 
      };
      
      const body = { mcode, service_no, customerMobile, option1, option2 };
  
      // Make API call
      const response = await axios.post(url, body, { headers });
      
      console.log("url response ",response);

      if (response.data.statuscode === 'TXN') {
        return res.status(200).json({ result: true, data: response.data.particulars, message: 'Bill validated successfully' , tokenValid: true});
      } else {
        return res.status(200).json({ result: false, data:response.data.particulars, message: response.data.message || 'Bill validation failed' , tokenValid: true });
      }
    } catch (error) {
      console.error('ValidateBill API error:', error);
      return res.status(200).json({ result: false, data: '', message: 'Internal server error' ,   tokenValid: true});
    }
  };
  


  
  //...........pay bill
  exports.paybill = async (req, res) => {
    const user = req.user; 
    try {
      const { number, opcode, amount} = req.body;
  
      // Validate the request body
      if (!number || !opcode || !amount) {
        return res
          .status(200)
         //.json({ result: false, data: "", message: "Missing required fields" });
          .json({ result: false, data: "", message: `Missing required fields ${req.body}`,  tokenValid: true});
  
      }
      console.log("API for recharge", req.body);
      const UId = user.UId;
      // console.log("DECODED  TOKEN  =", decoded);
      console.log("this DECODED FROM MW ", user)
  
      // Step 1: Run procedure 1 (SubmitRecharge) to get transaction ID and wallet balance
      const walletQuery = pool.request();
      walletQuery.input("UId", sql.Int, UId);
      walletQuery.input("RechNo", sql.VarChar(50), number);
      walletQuery.input("Code", sql.VarChar(30), opcode);
      walletQuery.input("Amount", sql.Decimal(18, 2), amount);
      walletQuery.output("TranId", sql.BigInt); // To get the transaction ID
      walletQuery.output("walletBal", sql.Decimal(18, 2)); // To get the wallet balance
  
      const walletResult = await walletQuery.execute("SubmitRecharge");
      const walletBal = walletResult.output.walletBal;
      const tranId = walletResult.output.TranId;
  
      console.log("Current balance:", walletBal, "Transaction ID:", tranId);
  
      // Check if the wallet balance is sufficient
      if (walletBal <= amount) {
        return res.status(200).json({
          result: false,
          data: "",
          message: `Insufficient wallet balance, Your Current Balance: ${walletBal}`,
          tokenValid: true
        });
      }
  
     if (!tranId || tranId < 0) {
  
  
    return res.status(200).json({
      result: false,
      data: "",
      message: `Invalid or missing tranID ${tranId}, Wallet Balance: ${walletBal}`,
      tokenValid: true
    });
  }
  
      
      // Proceed with recharge if balance is sufficient
      const circlecode = "*";
  
      console.log("this  are my .env data", username, token);
      const url = `https://pdrs.online/API2/RechargeNew?username=${username}&token=${token}&number=${number}&opcode=${opcode}&amount=${amount}&transid=${tranId}&circlecode=${circlecode}`;
      // const url = process.env.RECHARGE_URL;
  
      console.log("the URL --", url)
  
      // Make the API call to the recharge service
      const response = await axios.get(url);
      const responseData = response.data;
  
  
      // Step 2: Apply the second procedure (AddRecharge) to log the transaction
      const request = pool.request();
      request.input("TranId", sql.BigInt, tranId); // Use the transaction ID from step 1
      request.input("Status", sql.VarChar(50), responseData.status || "Failed");
      request.input(
        "Response",
        sql.NVarChar(sql.MAX),
        JSON.stringify(responseData)
      );
      request.output("flag", sql.VarChar(100)); // To get the flag from the procedure
  
      const result = await request.execute("AddRecharge");
      const outputFlag = result.output.flag;
  
              
  
      // If the API response indicates Success, do not subtract balance
      if (responseData.status === "Success") {
        return res.status(200).json({
          result: true,
          data: responseData,
          tokenValid: true,
    
   message: `Recharge Success: ${responseData.status}, URL = &{url}`,
          logFlag: outputFlag,
        });
      } else {
        return res.status(200).json({
          result: false,
          data: responseData,
        tokenValid: true,
      
   message: `Recharge Failed: ${responseData.status}, URL = &{url}`,
          logFlag: outputFlag,
        });
      }
  
   
    } catch (error) {
    
      res.status(200).json({
        result: false,
        data: "",
        message: "Error while processing recharge",
        error: error.message,
        tokenValid: true
      });
    }
  };