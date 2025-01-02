const sql = require("mssql");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendSignupSms,
  sendProfileSms,
} = require("../controllers/smsControllers");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    console.log("GET API calling for user table");
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .query("SELECT * FROM TBL_USER");
    res
      .status(200)
      .json({
        result: true,
        data: result.recordset,
        message: "Users fetched successfully",
        tokenValid: true,
      });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(200)
      .json({
        result: false,
        data: "",
        message: "Database error",
        tokenValid: true,
      });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  // Ensure the param is named 'id' in the route
  const user = req.user;

  const { id = user.UId } = req.params;
  console.log("this is my UId  fron token ", req.params);

  try {
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("UId", sql.Int, id) // Use 'id' from req.params

      .execute("GetUserDetail");

    if (result.recordset.length === 0) {
      return res
        .status(200)
        .json({
          result: false,
          data: "",
          message: "User not found",
          tokenValid: true,
        });
    }

    const userresult = result.recordset[0];
    delete userresult.password;
    res
      .status(200)
      .json({
        result: true,
        data: userresult,
        message: "User fetched successfully",
        tokenValid: true,
      });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(200)
      .json({
        result: false,
        data: "",
        message: "Database error",
        tokenValid: true,
      });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const poolConnection = await pool;
    await poolConnection
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .query("UPDATE TBL_USER SET name = @name, email = @email WHERE id = @id");
    res
      .status(200)
      .json({
        result: true,
        data: "",
        message: "User updated successfully",
        tokenValid: true,
      });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(200)
      .json({
        result: false,
        data: "",
        message: "Database error",
        tokenValid: true,
      });
  }
};

//Signup with geting token and user detalse

exports.signupUser = async (req, res) => {
  const { name, mobile, emailId, password } = req.body;

  try {
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("Name", sql.NVarChar, name)
      .input("Mobile", sql.NVarChar, mobile)
      .input("EmailId", sql.NVarChar, emailId)
      .input("Password", sql.NVarChar, password) // If you want to hash the password, use your hash function here
      .output("strResult", sql.NVarChar(50))
      .execute("Add_User");

    const strResult = result.output.strResult;

    if (strResult === "1") {
      // Fetch the newly created user from the database
      const userResult = await poolConnection
        .request()
        .input("Mobile", sql.NVarChar, mobile)
        .query(
          "SELECT UId=AppMstID, userId=AppMstRegNo, mobile=AppMstMobile, password=AppMstPassword, name=AppMstFName, emailId=email FROM AppMst WHERE AppMstMobile = @Mobile"
        );

      const user = userResult.recordset[0];

      // Generate token for the user
      const token = jwt.sign(
        {
          UId: user.UId,
          userId: user.userId,
          mobileno: user.mobile,
          name: user.name,
        },
        JWT_SECRET, 
        { expiresIn: "7d" }
      );

      // Respond with token and user details
      res.status(200).json({
        result: true,
        data: {
          token,
          UId: user.UId,
          userId: user.userId,
          name: user.name,
          mobileno: user.mobile,
          emailId: user.emailId,
        },
        message: "User created successfully",
      });

      // Call the sendSignupSms function after responding
      const signupMessage = `Dear ${user.name} Sign Up Successful ID No : ${user.userId} Password : ${user.password} from : triptalespay.com Triptales`;
      const tempId = "1107172897728276885";

      try {
        // Send SMS after successful signup
        await sendSignupSms(mobile, signupMessage, tempId);
        console.log("Signup SMS sent successfully");
      } catch (smsError) {
        console.error("Error sending signup SMS:", smsError);
      }
    } else {
      res.status(200).json({ result: false, data: "", message: strResult });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    res
      .status(200)
      .json({ result: false, data: "", message: "Server error during signup" });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { mobileno, password } = req.body;
  console.error("req body console", req.body); // Log the request body

  try {
    if (!mobileno || !password) {
      return res
        .status(200)
        .json({
          result: false,
          data: "",
          message: "Mobile number and password are required",
        });
    }

    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("Mobile", sql.NVarChar, mobileno)
      .query(
        "SELECT UId=AppMstID, userId=AppMstRegNo, mobile=AppMstMobile, password=AppMstPassword,  name=AppMstFName   FROM AppMst WHERE AppMstMobile = @Mobile"
      );

    console.log("this is my res qury from AppMst= ", result.recordset.length);

    if (result.recordset.length === 0) {
      return res
        .status(200)
        .json({ result: false, data: "", message: "User not found" });
    }

    const user = result.recordset[0];

    console.log("this all are USERS data = ", user);

    if (password !== user.password) {
      return res
        .status(200)
        .json({ result: false, data: "", message: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        UId: user.UId,
        userId: user.userId,
        mobileno: user.mobile,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .status(200)
      .json({
        result: true,
        data: {
          token,
          UId: user.UId,
          userId: user.userId,
          name: user.name,
          mobileno: user.mobile,
          emailId: user.emailId,
        },
        message: "Login successful",
      });
  } catch (error) {
    console.error("Error during login:", error); // Log the error message
    res
      .status(200)
      .json({
        result: false,
        data: "",
        message: "Database error during login",
      });
  }
};

exports.getUserBalance2 = async (req, res) => {
  const user = req.user;
  const { id = user.UId } = req.params;

  console.log("logs data", req.user);

  try {
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("UId", sql.Int, id) // Use 'id' from req.params
      .query("SELECT  FROM AppMst WHERE AppMstID = @UId");

    console.log("result for query UID", result.recordset); // Fixed the typo
    walletBal;
    if (result.recordset.length === 0) {
      return res
        .status(200)
        .json({
          result: false,
          data: "",
          message: "Wallet balance not found",
          tokenValid: true,
        });
    }

    // Accessing only the walletBal value
    const walletBal = result.recordset[0].walletBal;
    console.log("This is my wallet balance:", walletBal);

    res
      .status(200)
      .json({
        result: true,
        data: walletBal,
        message: "Wallet balance fetched successfully",
        tokenValid: true,
      });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(200)
      .json({
        result: false,
        data: "",
        message: "Database error",
        tokenValid: true,
      });
  }
};



//GET RECHARGE LOGS
const moment = require("moment"); // Ensure moment.js is installed

  
exports.getUserBalance = async (req, res) => {
  const { min, max } = req.body; 
  console.log("this data from req.body", req.body);
  const user = req.user;
  console.log("this is from user data ", user);
  const UId = user.UId;
  const userId = user.userId;
  console.log("uid++++++", UId);
  
  try {
    console.log("get recharge logs API calling...");
    const poolConnection = await pool;  
    const result = await poolConnection.request()
      .input('UId', sql.Int, UId || 0)  
      .input('min', sql.VarChar(20), min || '')  
      .input('max', sql.VarChar(20), max || '')  
      .input('userId', sql.VarChar(50), userId || '')  
      .execute('Tran_Rech_Logs');  

    const logs = result.recordset;

    // Format the `doe` field and ensure `Doe` is set correctly
    // const formattedLogs = logs.map(log => ({
    //   ...log,
    //   doe: log.doe 
    //     ? moment(log.doe, 'MMM DD YYYY hh:mmA').format('DD-MM-YYYY hh:mm A') 
    //     : null 
    // }));

   // console.log("Formatted Response Data", formattedLogs);

    if (logs.length > 0) {
      res.status(200).json({
        result: true,
        data: logs,
        message: 'Recharge logs retrieved successfully',
        tokenValid: true
      });
    } else {
      res.status(200).json({
        result: false,
        message: 'No recharge logs found for the given parameters',
        tokenValid: true
      });
    }
  } catch (error) {
    console.error('Error retrieving recharge logs:', error);
    res.status(200).json({
      result: false,
      message: 'Database error during recharge log retrieval',
      tokenValid: true
    });
  }
};





//........................UPDATE PROFILEPIC USER  SIDE ..........................
const path = require("path");

exports.updateProfile = async (req, res) => {
  const { name } = req.body;
  const user = req.user;
  const UId = user.UId;
  const mobile = user.mobileno;

  try {
    console.log("updateProfile API called", req.body, "UID----", UId);

    // Check if a file was uploaded and get the filename if it exists
    let user_img = "";
    if (req.file && req.file.filename) {
      user_img = req.file.filename; // Store the filename to save in DB
    }

    console.log("Data to update:", { name, UId, user_img });

    const poolConnection = await pool; // Assuming pool is defined elsewhere for DB connection

    // Update user profile in the database
    const result = await poolConnection
      .request()
      .input("AppMstID", sql.Int, UId)
      .input("AppMstFName", sql.NVarChar, name)
      .input("imagename", sql.NVarChar, user_img) // Pass filename or empty string
      .query(`
        UPDATE AppMst 
        SET 
          AppMstFName = @AppMstFName, 
          imagename = CASE 
                       WHEN @imagename != '' THEN @imagename 
                       ELSE imagename 
                     END
        WHERE AppMstID = @AppMstID
      `);

    console.log("Rows affected:", result.rowsAffected);

    // Check if the update was successful
    if (result.rowsAffected[0] > 0) {
      res.status(200).json({
        result: true,
        message: "User profile updated successfully",
        imageUrl: user_img,
        name: name,
        tokenValid: true,
      });

      // Call the sendUpdatteProfileSms function after responding
      const signupMessage = `Dear ${name} ID No: ${user.userId} Profile Updated. Triptales`;
      const tempId = "1107172897794225947";

      console.log("SMS--", signupMessage);

      try {
        // Send SMS after successful signup

        console.log("Number for send sms ", mobile);
        await sendSignupSms(mobile, signupMessage, tempId);
        console.log("Signup SMS sent successfully");
      } catch (smsError) {
        console.error("Error sending signup SMS:", smsError);
      }
    } else {
      res.status(200).json({
        result: false,
        message: "User not found or no changes made",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(200).json({
      result: false,
      message: "Server error during profile update",
      tokenValid: true,
    });
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//.........NEW FUNCTION FOR UPLODE PIC IN BACKEND /PUBLIC FOLDER ......//

//................................................................new  function for signUp...........................//

const axios = require("axios");
const otpGenerator = require("otp-generator"); // To generate OTP
const otpCache = {}; // Temporary object to store OTPs; for production use Redis or DB

exports.signupUserV2 = async (req, res) => {
  const { name, mobile, emailId, password } = req.body;
  console.log("OTP CAHE ---------", otpCache);

  const username = process.env.USERNAME2 || "8093073099";
  const token = process.env.PDRS_TOKEN || "617301924407158903058226494669";
  try {
    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    console.log("otp-------", otp);

    otpCache[mobile] = otp; // Store OTP for the mobile number temporarily
    console.log("this  is my OTP FOR  SENT IN MOBILE ", otp);

    // Send OTP via the function you already have (adjust accordingly)
    //const otpUrl = `https://pdrs.online/webapi/Send_otp?username=${username}&token=${token}&otp=${otp}&number=${mobile}`;
    const otpUrl = `https://pdrs.online/webapi/Send_otp?username=${username}&token=${token}&otp=${otp}&number=${mobile}&order_id=${otp}`;
    const otpResponse = await axios.get(otpUrl);

    if (otpResponse.data.status === "Success") {
      return res.status(200).json({
        result: true,
        message:
          "OTP sent successfully. Please verify your OTP to complete registration.",
      });
    } else {
      return res.status(200).json({
        result: false,
        message: "Failed to send OTP",
      });
    }
  } catch (error) {
    console.error("Error during signup and OTP sending:", error);
    return res
      .status(500)
      .json({ result: false, message: "Error during signup and OTP sending" });
  }
};

//  API  FOR GETING ADMIN SIDE BANK LIST
exports.getBankList = async (req, res) => {
  try {
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .query(
        "SELECT CompanyBank, CompanyAccNo FROM companymst WHERE Active = 1"
      );
    if (result.recordset.length > 0) {
      console.log("this are bank list", result.recordset);

      return res.status(200).send(
        // result: true,
        // message: 'Active Bank list retrieved successfully',
        result.recordset
      );
    } else {
      return res.status(200).json({
        result: false,
        message: "No active banks found",
        data: [],
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error fetching bank list:", error);
    return res.status(200).json({
      result: false,
      message: "Error retrieving bank list",
      error: error.message,
      tokenValid: true,
    });
  }
};

/////////////////////////////////////////////

// GET USER SIDE BANK LIST
exports.getUserBank = async (req, res) => {
  try {
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .query("Select BankName from Bankmst");
    if (result.recordset.length > 0) {
      return res.status(200).send(
        // result: true,
        // message: 'Active Bank list retrieved successfully',
        result.recordset
      );
    } else {
      return res.status(200).json({
        result: false,
        message: "No active banks found",
        data: [],
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error fetching bank list:", error);
    return res.status(200).json({
      result: false,
      message: "Error retrieving bank list",
      error: error.message,
      tokenValid: true,
    });
  }
};

//.........................ADD REQ  AMOUNT NEW FUNCTION ...............................//

exports.addMoneyRequest = async (req, res) => {
  console.log("add user amount requst ..");
  const {
    amount,
    userBank,
    userAccNo,
    paymentType,
    paymentDate,
    // slipImage,
    transactionNo,
    remark,
    company_acc_number,
    company_bank_name,
  } = req.body;

  const user = req.user;
  console.log("user data", user);
  //userId:
  try {
    //.....Added new configretion for multer
    if (!req.file) {
      return res.status(200).json({
        result: false,
        message: "No file uploaded",
        tokenValid: true,
      });
    }

    const slipImage = path.join(req.file.filename);

    // const UId = user.UId;
    const PregNo = user.userId;
    console.log("PreGNo  ------", PregNo);
    //const PregNo = userId;

    // Execute the 'Applywalletrequest' stored procedure

    const poolConnection = await pool;

    const result = await poolConnection
      .request()
      .input("requestId", sql.Int, null)
      .input("PregNo", sql.VarChar(50), PregNo)
      .input("Amt", sql.Float, amount)
      .input("PaymentType", sql.VarChar(50), paymentType || "")
      .input("PaymentDate", sql.DateTime, paymentDate || null)
      .input("CompanyAccNo", sql.VarChar(50), company_acc_number || "")
      .input("CompanyBank", sql.VarChar(50), company_bank_name || "")
      .input("UserAccNo", sql.VarChar(50), userAccNo)
      .input("UserBank", sql.VarChar(50), userBank || "")
      .input("Remark", sql.VarChar(100), remark || "")
      .input("SlipImage", sql.VarChar(50), slipImage || "")
      .input("TransactionNo", sql.VarChar(50), transactionNo)
      .output("flag", sql.VarChar(100))
      .execute("Applywalletrequest");

    // Get the output flage
    const flag = result.output.flag;

    console.log("flag for result----", flag);

    // Check the output flag and respond accordingly
    if (flag === "1") {
      return res.status(200).json({
        result: true,
        message: `wallet request has been submitted successfully for Amount :- ${amount}`,
        tokenValid: true,
      });
    } else {
      return res.status(200).json({
        result: false,
        message: flag,
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error submitting money request:", error);
    res.status(200).json({
      result: false,
      message: "Error submitting request",
      error: error.message,
      tokenValid: true,
    });
  }
};


// GET USER WALLET REQUEST TABLE
// exports.getWaletReq = async (req, res) => {
//   try {
//     const user = req.user;

//     const { status, fromdate, todate } = req.body;
//     let query = `SELECT * FROM userwalletrequestmst WHERE 1=1`;
//     let params = {};

//     // Check if user and userId exist
//     if (user && user.userId) {
//       query += ` AND AppMstREgNo = @UserId`;
//       params.UserId = user.userId;
//     }

//     // Apply status filter if provided
//     if (status) {
//       query += ` AND Status = @Status`;
//       params.Status = status;
//     }

//     // Apply date range filter if fromdate and todate are provided
//     if (fromdate && todate) {
//       query += ` AND CAST(doe AS DATE) BETWEEN @fromdate AND @todate`;
//       params.fromdate = fromdate;
//       params.todate = todate;
//     }

//     const poolConnection = await pool;
//     const request = poolConnection.request();

//     // Bind parameters dynamically based on provided values
//     if (params.UserId) request.input("UserId", sql.VarChar, params.UserId);
//     if (params.Status) request.input("Status", sql.Int, params.Status);
//     if (params.fromdate) request.input("fromdate", sql.Date, params.fromdate);
//     if (params.todate) request.input("todate", sql.Date, params.todate);

//     const result = await request.query(query);

//     console.log("This is wallet request logs --- ", result);

//     res.status(200).json({
//       success: true,
//       data: result.recordset,
//       tokenValid: true,
//     });
//   } catch (error) {
//     console.error("Error fetching wallet requests: ", error);
//     res.status(200).json({
//       success: false,
//       message: "Error fetching wallet requests",
//       error: error.message,
//       tokenValid: true,
//     });
//   }
// };

 
///////////////////


exports.getWaletReq = async (req, res) => {
  try {
    const user = req.user;

    const { status, fromdate, todate } = req.body;
    let query = `SELECT * FROM userwalletrequestmst WHERE 1=1`;
    let params = {};

   
    if (user && user.userId) {
      query += ` AND AppMstREgNo = @UserId`;
      params.UserId = user.userId;
    }

   
    if (status) {
      query += ` AND Status = @Status`;
      params.Status = status;
    }

   
    if (fromdate && todate) {
      // Convert dates from DD-MM-YYYY to YYYY-MM-DD for SQL compatibility
      const formattedFromDate = moment(fromdate, "DD-MM-YYYY").format("YYYY-MM-DD");
      const formattedToDate = moment(todate, "DD-MM-YYYY").format("YYYY-MM-DD");

      query += ` AND CAST(doe AS DATE) BETWEEN @fromdate AND @todate`;
      params.fromdate = formattedFromDate;
      params.todate = formattedToDate;
    }

    const poolConnection = await pool;
    const request = poolConnection.request();

    
    if (params.UserId) request.input("UserId", sql.VarChar, params.UserId);
    if (params.Status) request.input("Status", sql.Int, params.Status);
    if (params.fromdate) request.input("fromdate", sql.Date, params.fromdate);
    if (params.todate) request.input("todate", sql.Date, params.todate);

    const result = await request.query(query);

    console.log("This is wallet request logs --- ", result);

    res.status(200).json({
      success: true,
      data: result.recordset,
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error fetching wallet requests: ", error);
    res.status(200).json({
      success: false,
      message: "Error fetching wallet requests",
      error: error.message,
      tokenValid: true,
    });
  }
};


//FORGET PASSWORD FOR USER
exports.forgetPass = async (req, res) => {
  const { mobile } = req.body;
  console.log("forget password  function calling ", req.body);

  try {
    const poolConnection = await pool;
    // Step 1: Check if the mobile number exists in the AppMst table
    const userCheck = await poolConnection
      .request()
      .input("Mobile", mobile)
      .query(
        "SELECT AppMstMobile, AppMstFName, AppMstId, AppMstPassword, walletBal, AppMstRegNo FROM AppMst WHERE AppMstMobile = @Mobile"
      );

    const user = userCheck.recordset[0];

    // If no user found with the provided mobile number
    if (user.AppMstMobile != mobile) {
      return res.status(200).json({
        success: false,
        message: "Mobile number not found",
        tokenValid: true,
      });
    }

    console.log("This is my user from mobile no ", user.AppMstMobile);

    // Step 2: Compose SMS message
    const signupMessage = `Dear ${user.AppMstFName}, ID No ${user.AppMstRegNo}. Your Password : ${user.AppMstPassword} from triptalespay.com Triptales`;
    const tempId = "1107172897740056085";

    console.log("SMS--", signupMessage);

    try {
      // Step 3: Send SMS after successful mobile check
      console.log("Number for send SMS", mobile);
      await sendSignupSms(mobile, signupMessage, tempId);
      console.log("Signup SMS sent successfully");

      // Respond with success
      res.status(200).json({
        success: true,
        message: "Password reset SMS sent successfully",
        tokenValid: true,
      });
    } catch (smsError) {
      console.error("Error sending signup SMS:", smsError);
      res.status(200).json({
        success: false,
        message: "Error sending SMS",
        error: smsError.message,
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error processing forget password request: ", error);
    res.status(200).json({
      success: false,
      message: "Mobile number not found",
      error: error.message,
      tokenValid: true,
    });
  }
};

