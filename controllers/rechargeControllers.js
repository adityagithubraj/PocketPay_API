const axios = require("axios");
const pool = require("../config/db");
const sql = require("mssql");
const jwt = require("jsonwebtoken");

const fs = require("fs");
const path = require("path");

require("dotenv").config();

//...................this function  for logs .................//

function logToFile(message) {
  const logFilePath = path.join(__dirname, "logs", "recharge.log");
  const logMessage = `${new Date().toISOString()} - ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage, "utf8");
}

//.................end function...............//

//RECHARGE FUNCTION 
exports.recharge = async (req, res) => {
    const user = req.user; 
    try {
  
      const { number, opcode, amount} = req.body;
    
  
      // Validate the request body
      if (!number || !opcode || !amount) {
        return res
          .status(200)
         //.json({ result: false, data: "", message: "Missing required fields" });
          .json({ result: false, data: "", message: `Missing required fields ${req.body}`,tokenValid: true });
  
      }
  
      console.log("API for recharge", req.body);
      const UId = user.UId;
      // console.log("DECODED  TOKEN  =", decoded);
      //console.log("this DECODED FROM MW ", user)
  
  
      
  
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
      if (walletBal < amount) {
        return res.status(200).json({
          result: false,
          data: "",
          tokenValid: true,
          message: `Insufficient wallet balance, Your Current Balance: ${walletBal}, TID : ${tranId}, NUM:${number}, OPCODE: ${opcode}, AMOUNT: ${amount}, UID: ${UId }`,
        });
      }
  
     if (!tranId || tranId <= 0) {
  
  
    return res.status(200).json({
      result: false,
      data: "",
      message: `Invalid or missing tranID ${tranId}, Wallet Balance: ${walletBal}`,
      tokenValid: true
    });
  }
  
      
      // Proceed with recharge if balance is sufficient
      const username =process.env.USERNAME2;
      const token = process.env.PDRS_TOKEN;
 
      const circlecode = "*";
  
      console.log("this  are my .env data", username, token);
      const url = `https://pdrs.online/API2/RechargeNew?username=${username}&token=${token}&number=${number}&opcode=${opcode}&amount=${amount}&transid=${tranId}&circlecode=${circlecode}`;
                 //https://pdrs.online/API2/RechargeNew?username=8093073099&token=617301924407158903058226494669&number=DL8CBF1677&opcode=ICtag&amount=500&transid=1731406376299&circlecode=*

      // const url = process.env.RECHARGE_URL;
  
  
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
    
          message: `Recharge Success: ${responseData.status}`,
          logFlag: outputFlag,
        });
      } else {
        return res.status(200).json({
          result: false,
          data: responseData,
      
           message: `Recharge Failed: ${responseData.status}`,
          logFlag: outputFlag,
          tokenValid: true
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
  

///......................................................................................................//

//..............................Complain API for recharge .....................................//

exports.sendComplain = async (req, res) => {
  //const user = req.user;
  try {
    const { order_id, message } = req.body;

    // Validate the request body
    if (!order_id || !message) {
      return res
        .status(200)
        .json({ result: false, data: "", message: `Missing required fields ${req.body}` ,tokenValid: true});
    }

    const username = "8093073099";
    const token = "617301924407158903058226494669";

    const url = `https://pdrs.online/API2/complain_api?username=${username}&token=${token}&order_id=${order_id}&Message=${message}`;

    //  API call to send the complaint
    const response = await axios.get(url);
    const responseData = response.data;

    // Log the complaint in recharge_logs table
    const request = pool.request();
    request.input("order_id", sql.BigInt, order_id);
    request.input("complain", sql.NVarChar(sql.MAX), message);
    request.input("complainStatus", sql.NVarChar(sql.MAX), JSON.stringify(responseData));
    await request.query(`UPDATE recharge_logs SET complain = @complain, complainStatus=@complainStatus, complain_flag=1 WHERE RId = @order_id`);

    if (responseData.status === 0) {
      return res.status(200).json({
        result: true,
        data: responseData,
        message: `Complain submitted successfully for order ID: ${order_id}`,
        tokenValid: true
      });
    } else {
      return res.status(200).json({
        result: false,
        data: responseData,
        message: `Complain submission failed for order ID: ${order_id}`,
        tokenValid: true
      });
    }
  } catch (error) {
    res.status(200).json({
      result: false,
      data: "",
      message: "Error while submitting complain",
      error: error.message,
      tokenValid: true
    });
  }
};



//..........................THIS API FOR GET COMPLAIN STATUS .......................//

exports.getComplainStatus = async (req, res) => {
 // const user = req.user;
  try {
    const { order_id } = req.body;


    if (!order_id) {
      return res
        .status(200)
        .json({ result: false, data: "", message: `Missing required fields ${req.body}` });
    }

    const username = "8093073099";
    const password = "249327";

    const url = `https://pdrs.online/API2/complain_api/getComplainStatus?username=${username}&password=${password}&order_id=${order_id}`;


    const response = await axios.get(url);
    const responseData = response.data;

    const request = pool.request();
    request.input("order_id", sql.BigInt, order_id);
    request.input("complainStatus", sql.NVarChar(sql.MAX), JSON.stringify(responseData));
    await request.query(`UPDATE recharge_logs SET complainStatus = @complainStatus WHERE RId = @order_id`);

    if (responseData.status === 0) {
      return res.status(200).json({
        result: true,
        data: responseData,
        message: `Complain status fetched successfully for order ID: ${order_id}`,
        tokenValid: true
      });
    } else {
      return res.status(200).json({
        result: false,
        data: responseData,
        message: `Failed to fetch complain status for order ID: ${order_id}`,
        tokenValid: true
      });
    }
  } catch (error) {
    res.status(200).json({
      result: false,
      data: "",
      message: "Error while fetching complain status",
      error: error.message,
      tokenValid: true
    });
  }
};
