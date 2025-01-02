const sql = require("mssql");
const pool = require("../config/db");
const cron = require("node-cron");
const { sendSignupSms } = require("../controllers/smsControllers");
const multer = require("multer");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const axios = require("axios");
const path = require("path");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const username = process.env.USERNAME2;
const token = process.env.PDRS_TOKEN;

//STAPE2 :- Login ADMIN    - DONE
//STAPE3 :- Get User list & All Recharge Logs with adv lavel filteration  - DONE
//STAPE4 :- Update user wallate -  WORKING
//STAPE5 :- Provide Offer imge

//Admin Login function
exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  console.error("Request body:", req.body);


  try {
    if (!username || !password) {
      return res.status(200).json({
        result: false,
        data: "",
        message: "Username and password are required",
        tokenValid: true,
      });
    }

    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("username", sql.NVarChar, username)
      .query(
        "SELECT UId=srno, mobile=mobileno, password=password, name=name, userRole=username, lock , admintype, Roleid FROM controlmst WHERE username = @username"
      );

    console.log("Query result length:", result.recordset.length);

    if (result.recordset.length === 0) {
      return res.status(200).json({
        result: false,
        data: "",
        message: "Admin not found",
        tokenValid: true,
      });
    }

    const user = result.recordset[0];
    console.log("User data:", user);

    // Check if the account is locked
    if (user.lock === 1) {
      return res.status(200).json({
        result: false,
        data: "",
        message: "You are locked by the admin",
        tokenValid: true,
      });
    }

    // Check if the password matches
    if (password !== user.password) {
      return res.status(200).json({
        result: false,
        data: "",
        message: "Incorrect password",
        tokenValid: true,
      });
    }

    // Include username in the token payload
    const token = jwt.sign(
      {
        UId: user.UId,
        userRole: user.userRole,
        mobileno: user.mobile,
        name: user.name,
        username: user.userRole,
        admintype: user.admintype,
        Roleid: user.Roleid,
      },
      JWT_SECRET,
      { expiresIn: "38d" }
    );

    console.log("Generated token response:", {
      result: true,
      data: {
        token,
        UId: user.UId,
        userId: user.UId,
        name: user.name,
        mobileno: user.mobile,
        username: user.userRole,
        admintype: user.admintype,
        Roleid: user.Roleid,
      },
      message: "Login successful",
    });

    res.status(200).json({
      result: true,
      data: {
        token,
        UId: user.UId,
        userId: user.UId,
        name: user.name,
        mobileno: user.mobile,
        username: user.userRole,
        admintype: user.admintype,
        Roleid: user.Roleid,
      },
      message: "Login successful",
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(200)
      .json({
        result: false,
        data: "",
        message: "Database error during login",
        tokenValid: true,
      });
  }
};

// Get All user List
exports.getUsers = async (req, res) => {
  try {
    const {
      FromDate,
      ToDate,
      regno,
      AppMstFName,
      AppMstState,
      District,
      AppMstMobile,
      panno,
      BankName,
      AccNo,
      Ifsc,
      IsActive,
      Adminid,
      OnlinePanVerify,
      PanStatus,
      BankStatus,
      AadharStatus,
    } = req.body;

    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("FromDate", sql.VarChar(50), FromDate || "")
      .input("ToDate", sql.VarChar(50), ToDate || "")
      .input("regno", sql.VarChar(50), regno || "")
      .input("AppMstFName", sql.VarChar(50), AppMstFName || "")
      .input("AppMstState", sql.VarChar(50), AppMstState || "")
      .input("District", sql.VarChar(50), District || "")
      .input("AppMstMobile", sql.VarChar(50), AppMstMobile || "")
      .input("panno", sql.VarChar(50), panno || "")
      .input("BankName", sql.VarChar(500), BankName || "")
      .input("AccNo", sql.VarChar(50), AccNo || "")
      .input("Ifsc", sql.VarChar(50), Ifsc || "")
      .input("IsActive", sql.Int, IsActive || -1)
      .input("Adminid", sql.VarChar(50), Adminid || "")
      .input("OnlinePanVerify", sql.Int, OnlinePanVerify || -1)
      .input("PanStatus", sql.VarChar(50), PanStatus || "")
      .input("BankStatus", sql.VarChar(50), BankStatus || "")
      .input("AadharStatus", sql.VarChar(50), AadharStatus || "")
      .execute("AssociateData");

    res.status(200).json({
      result: true,
      data: result.recordset,
      message: "Data retrieved successfully",
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error calling AssociateData:", error);
    res.status(200).json({
      result: false,
      message: "An error occurred",
      tokenValid: true,
    });
  }
};

//get curent Login controler tbl detalse
exports.getAdmin = async (req, res) => {
  //const user = req.user ;
  let token = req.headers["authorization"];
  console.log("user by heders ", token);

  if (!token) {
    return res.status(200).json({
      result: false,
      data: "",
      message: "Access denied. No token provided.",
      tokenValid: false,
    });
  }
  token = token.replace(/"/g, "");
  try {
    const data = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token: ", data);

    res
      .status(200)
      .json({
        result: true,
        data,
        message: "this are admin ..!!",
        tokenValid: true,
      });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(200)
      .json({
        result: false,
        data: "",
        message: "Database error during login",
        tokenValid: true,
      });
  }
};

//Get User walet ball direct  from PDRS API
exports.getAdminwaletbal = async (req, res) => {
  const user = req.user;
  try {
    const url = `https://pdrs.online/API2/Balance?username=${username}&token=${token}`;
    const getAdminwaletbal = await axios.get(url);

    if (getAdminwaletbal.data.status === "Success") {
      return res.status(200).json({
        data: getAdminwaletbal.data,
        result: true,
        message: "successfully fetch  bal",
        tokenValid: true,
      });
    } else {
      return res.status(200).json({
        data: getAdminwaletbal.data,
        result: false,
        message: "Failed to fetch bal",
        tokenValid: true,
      });
    }
  } catch (error) {
    return res
      .status(200)
      .json({
        result: false,
        message: "Error during fetch bal api",
        tokenValid: true,
      });
  }
};

exports.getUserRecLogs = async (req, res) => {
  const { min, max, UId, userId } = req.body;
  console.log("this data from req.body", req.body);

  // const user = req.user;
  // console.log("this is from user data ", user );
  // const UId = user.UId;
  // const userId  =user.userId
  // console.log("uid++++++", UId);

  try {
    console.log("grt recharge logs api calling ///");
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("UId", sql.Int, UId || 0)
      .input("min", sql.VarChar(20), min || "")
      .input("max", sql.VarChar(20), max || "")
      .input("userId", sql.VarChar(50), userId || "")
      .execute("Tran_Rech_Logs");

    // If you want to return the entire result set
    const logs = result.recordset;
    console.log("RESPONCE DATA ", result);

    if (logs.length > 0) {
      res.status(200).json({
        result: true,
        data: logs,
        message: "Recharge logs retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No recharge logs found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error retrieving recharge logs:", error);
    res.status(200).json({
      result: false,
      message: "Database error during recharge log retrieval",
      tokenValid: true,
    });
  }
};

// Get Users Wallet Request
// exports.gteWaletreq = async (req, res) => {
//   const { fromdate, Todate, Status } = req.body;

//   try {
//     console.log("Get wallet request API called adn  this is my reqody ", req.body);

//     const poolConnection = await pool;

//     const result = await poolConnection
//       .request()
//       .input("fromdate", fromdate || null)
//       .input("Todate", Todate || null)
//       .input("Status", Status || 0)
//       .execute("userWalletRequest");

//     const logs = result.recordset;

//     console.log("Response data: ", result);

//     if (logs.length > 0) {
//       res.status(200).json({
//         result: true,
//         data: logs,
//         message: "Wallet requests retrieved successfully",
//         tokenValid: true,
//       });
//     } else {
//       res.status(200).json({
//         result: false,
//         message: "No wallet requests found for the given parameters",
//         tokenValid: true,
//       });
//     }
//   } catch (error) {
//     console.error("Error retrieving wallet requests: ", error);
//     res.status(200).json({
//       result: false,
//       message: "An error occurred while retrieving wallet requests",
//       tokenValid: true,
//     });
//   }
// };

//.....................//

exports.gteWaletreq = async (req, res) => {
  const { fromdate, Todate, Status } = req.body;

  try {
    console.log("Get wallet request API called with request body:", req.body);

    const poolConnection = await pool;

    // Execute the stored procedure
    const result = await poolConnection
      .request()
      .input("fromdate", fromdate)
      .input("Todate", Todate)
      .input("Status", Status || 0)
      .execute("userWalletRequest");

    const logs = result.recordset;

    console.log("Response data: ", logs);

    if (logs.length > 0) {
      res.status(200).json({
        result: true,
        data: logs,
        message: "Wallet requests retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No wallet requests found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error retrieving wallet requests: ", error);
    res.status(500).json({
      result: false,
      message: "An error occurred while retrieving wallet requests",
      tokenValid: true,
    });
  }
};




///////////////////

// Function for Approving or Rejecting the User Wallet Request

exports.approveWalletRequest = async (req, res) => {
  const { admin, srno, regno, status, coment, epwd, amt } = req.body;
  console.log("GET request from body ", req.body);

  try {
    console.log("Approve wallet request API called");
    const poolConnection = await pool;

    // Step 1: Execute the procedure to approve/reject the request
    const result = await poolConnection
      .request()
      .input("admin", sql.VarChar(50), admin || "admin")
      .input("Srno", sql.Int, srno || null)
      .input("regno", sql.VarChar(50), regno || null)
      .input("status", sql.Int, status || null) // status 1 for approve and 2 for reject
      .input("coment", sql.VarChar(200), coment || null)
      .input("Epwd", sql.VarChar(50), epwd || null)
      .output("flag", sql.VarChar(100))
      .execute("ApproveUserWallet");

    const flag = result.output.flag;
    console.log("Flag from approval procedure:", flag, "status", status);

    if (flag == "1" && status == 1) {
      // Step 2: If approved, retrieve user details and send an SMS

      try {
        const balanceResult = await poolConnection
          .request()
          .input("srno", sql.VarChar, srno)
          //.query(`SELECT walletBal, AppMstFName FROM AppMst WHERE AppMstRegNo = @regno`);
          .query(
            `select w.Amount, AppMstFName from AppMst a join userwalletRequestmst w on a.AppMstRegNo=w.AppMstREgNo where w.WalletRequestId=@srno`
          );

        const { Amount, AppMstFName } = balanceResult.recordset[0];
        //console.log("RegNo:", regno, "Message:", signupMessage);
        console.log("now i am iside try block", Amount , AppMstFName);

        const signupMessage = `Dear ${AppMstFName}, ID No: ${regno}, Service Wallet ${Amount} received successfully. Triptales`;
        const tempId = "1107172897802628491";

        console.log("RegNo:", regno, "Message:", signupMessage, "Amount id:------", Amount);
      
        // Send SMS
        await sendSignupSms(regno, signupMessage, tempId);
        console.log("Approve Wallet Request SMS sent successfully");
      } catch (smsError) {
        console.error("Error sending signup SMS:", smsError);
      }

      res.status(200).json({
        result: true,
        message: "Wallet request approved successfully",
        tokenValid: true,
      });
    } else if (flag == "1" && status == 2) {
      // Step 3: Handle rejection case
      res.status(200).json({
        result: true,
        message: "Wallet request rejected successfully",
        tokenValid: true,
      });
    } else {
      // Step 4: Handle other cases based on flag
      res.status(200).json({
        result: false,
        message: flag,
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error approving wallet request:", error);
    res.status(200).json({
      result: false,
      message: "An error occurred while approving the wallet request",
      tokenValid: true,
    });
  }
};

//////////////////

// Update the slider img and poster from aAdmin side annd show in User side and alo show in Admin side for prevew
exports.addSliderimge = async (req, res) => {
  const { h1, h2, status, isMain, uploadedDate, linke } = req.body;
  const user = req.user;

  try {
    console.log(
      "Slider image upload API calling and this is my req.body data",
      req.body
    );

    if (!req.file) {
      return res.status(200).json({
        result: false,
        message: "No slider file uploaded",
        tokenValid: true,
      });
    }

    const slider_img = path.join(req.file.filename);
    console.log(`api.triptelspay.come/public/${slider_img}`);
    poolConnection = await pool;

    // Execute the stored procedure UploadSliderImage
    const result = await poolConnection
      .request()
      .input("h1", sql.VarChar(140), h1 || "")
      .input("h2", sql.VarChar(140), h2 || "")
      .input("Url", sql.VarChar(120), slider_img)
      .input("UploadedDate", sql.DateTime, uploadedDate || new Date())
      .input("Status", sql.Int, status || 0)
      .input("IsMain", sql.Int, isMain || 0)
      .input(
        "linke",
        sql.VarChar(120),
        linke || "https://test.triptalespay.com"
      )
      .output("flag", sql.Int)
      .execute("UploadSliderImage");

    const flag = result.output.flag;

    if (flag === 1) {
      return res.status(200).json({
        result: false,
        message: "Slider image already exists with the same URL.",
        tokenValid: true,
      });
    } else if (flag === 2) {
      return res.status(200).json({
        result: true,
        message: "Slider image uploaded successfully.",
        imageUrl: slider_img,
        h1: h1,
        h2: h2,
        tokenValid: true,
      });
    } else {
      return res.status(200).json({
        result: false,
        message: "Unexpected result from stored procedure.",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error during slider image upload:", error);
    res.status(200).json({
      result: false,
      message: "Server error during slider image upload",
      tokenValid: true,
    });
  }
};

//GET Uploded Slider img
exports.getSlideimge = async (req, res) => {
  try {
    const { IsMain } = req.body;
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("IsMain", sql.VarChar(50), IsMain)
      .execute("FetchSliderImage");

    res.status(200).json({
      result: true,
      data: result.recordset,
      message: "Data retrived successfullly",
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error calling AssociateData:", error);
    res.status(200).json({
      result: false,
      message: "An error occurred",
      tokenValid: true,
    });
  }
};

//DELETE SLIDER IMGE WITH ID
exports.deleteSlideimge = async (req, res) => {
  try {
    const { Id } = req.body; // Extract 'Id' from request body

    console.log("Id provided:", Id);

    // Check if 'Id' is provided
    if (!Id) {
      return res.status(200).json({
        result: false,
        message: "Id parameter is required",
        tokenValid: true,
      });
    }

    // Establish the database connection
    const poolConnection = await pool;

    // Call the stored procedure with 'Id' as input
    const result = await poolConnection
      .request()
      .input("id", sql.Int, Id) // Ensure 'id' is passed as an integer
      .execute("DeactiveSliderImage"); // Execute stored procedure

    // Check if a row was affected (i.e., a deletion occurred)
    if (result.rowsAffected[0] > 0) {
      return res.status(200).json({
        result: true,
        message: `Slider image with ID ${Id} deleted successfully`,
        tokenValid: true,
      });
    } else {
      return res.status(200).json({
        result: false,
        message: `No slider image found with ID ${Id}`,
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error deleting slider image:", error); // Log the error
    res.status(200).json({
      result: false,
      message: "An error occurred while deleting the slider image",
      tokenValid: true,
    });
  }
};

// function for GET wallet requst from user side
//   const tbl_for_store_wallet_requst  =  userwalletrequestmst;

const rejectOldWalletRequests = async () => {
  try {
    console.log("Running cron job to reject old wallet requests");

    const poolConnection = await pool;

    const DaysAgo = new Date();
    DaysAgo.setDate(DaysAgo.getDate() - 3);
    console.log("this is DaysAgo Variable", DaysAgo);

    // Call the stored procedure to reject wallet requests older than 3 days
    const result = await poolConnection
      .request()
      .input("DaysAgo", sql.DateTime, DaysAgo)
      .execute("RejectOldWalletRequests");

    console.log(
      `Old wallet requests processed successfully, ${result.rowsAffected} rows updated.`
    );
  } catch (error) {
    console.error("Error in rejecting old wallet requests:", error);
  }
};

//........Schedule the cron job to run daily at midnight
cron.schedule("0 0 * * *", () => {
  rejectOldWalletRequests();
  console.log("Cron job executed at midnight");
});

//............THIS  FUNCTION FOR SUB ADMIN AND ADMIN INSERTION  .............//

exports.createAdmin = async (req, res) => {
  const {
    loginId,
    password,
    name,
    mobile,
    userRole,
    region,
    regionState,
    state,
  } = req.body;

  try {
    if (
      !loginId ||
      !password ||
      !name ||
      !mobile ||
      !userRole ||
      !region ||
      !regionState
    ) {
      return res
        .status(200)
        .json({ message: "Please provide all required fields." });
    }

    const poolConnection = await pool;
    const request = poolConnection.request();

    // Set input parameters for the stored procedure
    request.input("loginId", sql.VarChar(50), loginId);
    request.input("pwd", sql.VarChar(50), password);
    request.input("name", sql.VarChar(50), name);
    request.input("mobile", sql.VarChar(50), mobile);
    request.input("state", sql.VarChar(50), state);
    request.input("RoleId", sql.Int, userRole);
    request.input("RegionId", sql.Int, region);
    request.input("RegionState", sql.VarChar(50), regionState);
    request.output("flag", sql.VarChar(50));

    const result = await request.execute("addsubadmin");
    const flag = result.output.flag;

    if (flag === "1") {
      // Success case
      res.status(200).json({
        message: "Subadmin created successfully",
        result: true,
        tokenValid: true,
      });
    } else {
      // User already exists or mobile number is taken
      res.status(200).json({
        message: flag,
        result: false,
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error creating admin:", error);
    res
      .status(200)
      .json({
        message: `Error creating admin: ${error.message}`,
        result: false,
        tokenValid: true,
      });
  }
};

//...........GET SUB ADMIN LIST FOR PERMITION ..............//

exports.getsubAdminList = async (req, res) => {
  const { username, name, mobileno, roleId } = req.body;

  try {
    console.log("getsubADMIN LIST  API CALLING WITH THIS DATA", req.body);

    // Check if at least one of the fields is provided
    // if (!username && !name && !mobileno && !roleId) {
    //   return res.status(200).json({
    //     message: "Please provide at least one search criterion.",
    //     result: false,
    //     data: [],
    //     tokenValid: true
    //   });
    // }

    // Establish the database connection
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Bind input parameters
    request.input("username", sql.NVarChar(50), username || "");
    request.input("name", sql.NVarChar(50), name || "");
    request.input("mobileno", sql.NVarChar(20), mobileno || "");
    request.input("RoleId", sql.Int, roleId || 0);

    // Execute the stored procedure
    const result = await request.execute("fetchAdmin");

    // Extract the rows returned by the procedure
    const adminList = result.recordset;

    if (adminList && adminList.length > 0) {
      // Sub-admins found
      return res.status(200).json({
        message: "Sub-admins fetched successfully.",
        result: true,
        data: adminList,
        tokenValid: true,
      });
    } else {
      // No sub-admins found
      return res.status(200).json({
        message: "No sub-admins found with the provided criteria.",
        result: false,
        data: [],
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error fetching sub-admins:", error);
    return res.status(500).json({
      message: `Error fetching sub-admins: ${error.message}`,
      result: false,
      tokenValid: true,
    });
  }
};

//................DELETE ADMIN PERMITION ......................//
exports.deleteAdmin = async (req, res) => {
  const { username } = req.body;

  try {
    // Validate input
    if (!username) {
      return res.status(200).json({
        message: "Username is required to delete an admin.",
        result: false,
        tokenValid: true,
      });
    }

    // Establish the database connection
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Bind input parameter
    request.input("uid", sql.NVarChar(50), username);

    // Execute the stored procedure
    await request.execute("deleteadmin");

    // Send success response
    return res.status(200).json({
      message: "Admin deleted successfully.",
      result: true,
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error deleting admin:", error);

    // Send error response
    return res.status(200).json({
      message: `Error deleting admin: ${error.message}`,
      result: false,
      tokenValid: true,
    });
  }
};

//...................PERMITION SETING ........................//
exports.updateAdminFields = async (req, res) => {
  const { srno, username, password, name, admintype, permition } = req.body;
  console.log("update admin api calling ", req.body );

  try {
    // Validate required input
    if (!srno) {
      return res.status(200).json({
        message: "SRNO is required to update fields.",
        result: false,
        tokenValid: true,
      });
    }

    // Establish the database connection
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Bind input parameters
    request.input("srno", sql.Int, srno);
    request.input("username", sql.NVarChar(50), username || null);
    request.input("password", sql.NVarChar(50), password || null);
    request.input("name", sql.NVarChar(50), name || null);
    request.input("admintype", sql.NVarChar(20), admintype || null);
    request.input("permition", sql.NVarChar(200), permition || null);

    // Execute the stored procedure
    const result = await request.execute("updateAdminFields");

    // Send success response
    return res.status(200).json({
      message: "Fields updated successfully.",
      result: true,
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error updating fields:", error);

    // Send error response
    return res.status(200).json({
      message: `Error updating fields: ${error.message}`,
      result: false,
      tokenValid: true,
    });
  }
};

//................ADMIN PAGES PERMITION ........................//

exports.upsertMultiplePagePermissions = async (req, res) => {
  const { permissions } = req.body;
  console.log(" insert admin page permition API calling ");

  try {
    // Validate required input
    if (
      !permissions ||
      !Array.isArray(permissions) ||
      permissions.length === 0
    ) {
      return res.status(400).json({
        message: "Permissions array is required and cannot be empty.",
        result: false,
        tokenValid: true,
      });
    }

    // Establish the database connection
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Start a transaction for multiple operations
    const transaction = poolConnection.transaction();
    await transaction.begin();

    // Process each permission entry
    for (const permission of permissions) {
      const { userid, pagename, permission: permValue } = permission;

      // Validate individual permission entry
      if (!userid || !pagename || permValue === undefined) {
        await transaction.rollback();
        return res.status(400).json({
          message:
            "Each permission must include 'userid', 'pagename', and 'permission'.",
          result: false,
          tokenValid: true,
        });
      }

      // Create a new request for each operation
      const transactionRequest = transaction.request();
      transactionRequest.input("userid", sql.NVarChar(50), userid);
      transactionRequest.input("pagename", sql.NVarChar(255), pagename);
      transactionRequest.input("permission", sql.Int, permValue);

      // Execute the stored procedure
      await transactionRequest.execute("UpsertPagePermission");
    }

    // Commit the transaction
    await transaction.commit();

    // Send success response
    return res.status(200).json({
      message: "All page permissions successfully inserted/updated.",
      result: true,
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error processing multiple page permissions:", error);

    // Rollback the transaction in case of error
    if (transaction) {
      await transaction.rollback();
    }

    // Send error response
    return res.status(500).json({
      message: `Error processing request: ${error.message}`,
      result: false,
      tokenValid: true,
    });
  }
};

//..............GET PERMITION BY ADMIN ...........................//

exports.getPagePermissions = async (req, res) => {
  try {
    // Extract user information from req.admin
    //const user = req.admin;
    // const userid= req.params;
    const { userid } = req.body; // Extract userid from req.params

    console.log("this is my userid", userid);

    // Establish the database connection
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Bind input parameter
    request.input("userid", sql.NVarChar(100), userid);

    // Execute the query to fetch page permissions
    const result = await request.query(
      //`SELECT pagename, permission FROM pagepermissions WHERE userid = @userid` 

      `SELECT pagename, CASE WHEN @userid = 'admin' THEN 1  ELSE permission END AS permission
       FROM ( SELECT DISTINCT pagename, permission FROM pagepermissions WHERE @userid = 'admin' OR userid = @userid ) AS filteredPages;`
    ); 
   

    // Check if records are found
    if (result.recordset.length === 0) {
      return res.status(200).json({
        message: "No permissions found for the specified user ID.",
        result: false,
        tokenValid: true,
      });
    }

    // Send success response with the fetched data
    return res.status(200).json({
      message: "Page permissions retrieved successfully.",
      data: result.recordset,
      result: true,
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error fetching page permissions:", error);

    // Send error response
    return res.status(500).json({
      message: `Error fetching page permissions: ${error.message}`,
      result: false,
      tokenValid: true,
    });
  }
};


//...................LOKED AND UNLOKED PERMITION FUNCTION ..................//
exports.changeLockStatus = async (req, res) => {
  const { srno, newLockStatus } = req.body;

  if (!srno || typeof newLockStatus !== "number" || ![0, 1].includes(newLockStatus)) {
    return res.status(400).json({
      message: "Invalid input. Ensure 'srno' is provided and 'newLockStatus' is 0 or 1.",
      result: false,
      tokenValid: true,
    });
  }

  console.log("Processing lock status update for:", { srno, newLockStatus });

  let transaction;

  try {
    const poolConnection = await pool;
    transaction = poolConnection.transaction();

    await transaction.begin(); // Start the transaction

    const request = transaction.request();
    request.input("srno", sql.Int, srno);
    request.input("NewLockStatus", sql.TinyInt, newLockStatus);
    request.output("Flag", sql.Int);


    const result = await request.execute("ChangeLockStatus");

    if (result.output.Flag !== 1) {
      throw new Error(`Failed to update lock status for SRNO ${srno}.`);
    }

    await transaction.commit(); 

    return res.status(200).json({
      message: "Lock status updated successfully.",
      result: true,
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error updating lock status:", error);

    if (transaction) {
      await transaction.rollback(); // Rollback the transaction on error
    }

    return res.status(500).json({
      message: `Error updating lock status: ${error.message}`,
      result: false,
      tokenValid: true,
    });
  }
};



//..........................WALLET....................................//

exports.getuserwallet = async (req, res) => {
  try {
    // Establish a database connection
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Execute the stored procedure
    const result = await request.execute("GetState");

    // Process the result
    if (result.recordset && result.recordset.length > 0) {
      res.status(200).json({
        message: "States fetched successfully.",
        result: true,
        data: result.recordset,
      });
    } else {
      res.status(200).json({
        message: "No states found.",
        result: false,
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({
      message: `Error fetching states: ${error.message}`,
      result: false,
    });
  }
};

//........................ HANDLE DEBIT AND CREDIT  .....................//

// exports.handleDebitCreditWallet = async (req, res) => {
//   const { admin, regNo, amount, type, remark } = req.body;
//   console.log("DEBET AND CREDIT API CALLING ", req.body);

//   try {
//     const poolConnection = await pool;
//     const result = await poolConnection
//       .request()

//       .input("admin",  admin)
//       .input("regNo",  regNo)
//       .input("amount",  amount)
//       .input("type", type)      // 1 for debit, 2 for credit
//       .input("remark",  remark)
//       .output("flag", sql.VarChar(100))
//       .execute("DebitCreditWallet");
    

//     const { flag } = result.output;
//     // Send success response
//     return res.status(200).send({ message: flag });
//   } catch (err) {
//     console.error("Transaction Error:", err);
//     return res
//       .status(200)
//       .send("An error occurred while processing the transaction.");
//   }
// };


//.................VERSON 2 FOR DEBIT AND CREDIT .......................//

exports.handleDebitCreditWallet = async (req, res) => {
  const { admin, regNo, amount, type, remark } = req.body;

  console.log("DEBIT AND CREDIT API CALLING", req.body);

  if (!admin || !regNo || !amount || !type || !remark) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  try {
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("admin", sql.VarChar(50), admin)
      .input("regNo", sql.VarChar(50), regNo)
      .input("amount", sql.Float, amount)
      .input("type", sql.Int, type) // 1 for debit, 2 for credit
      .input("remark", sql.VarChar(200), remark)
      .output("flag", sql.VarChar(100))
      .execute("DebitCreditWallet");

    const { flag } = result.output;

    if (!flag) {
      return res
        .status(200)
        .send({ message: "An unexpected error occurred. No flag returned." });
    }
    console.log("Transaction Successful:", flag);

    return res.status(200).send({ message: flag });
  } catch (err) {
    console.error("Transaction Error:", err.message);

    if (err.code) {
      console.error("SQL Error Code:", err.code);
    }

    return res
      .status(200)
      .send({ message: "An error occurred while processing the transaction.", error: err.message });
  }
};



//................TIKET SYSTEM ......//

//...............INSERT TICKET AND CONVERSETION START............//
// exports.insertMessage = async (req, res) => {
//   try {

//     const { Mid, SenderId, ReceiverId, Mtype, MsgSubject, Msg, isretailer, AssignTo, slipImage } = req.body;

//     if (!Mtype || !MsgSubject || !Msg) {
//       return res.status(200).json({
//         result: false,
//         message: "Mtype, MsgSubject, and Msg are required.",
//         tokenValid: true,
//       });
//     }

//    const Attach  = "";

//     const poolConnection = await pool;
//     const request = poolConnection.request();

//     request.input("Mid", sql.Int, Mid || 0);
//     request.input("SenderId", sql.NVarChar(100), SenderId || null);
//     request.input("ReceiverId", sql.NVarChar(100), ReceiverId || null);
//     request.input("Mtype", sql.NVarChar(50), Mtype);
//     request.input("MsgSubject", sql.VarChar, MsgSubject);
//     request.input("Msg", sql.VarChar, Msg);
//     request.input("isretailer", sql.Int, isretailer || 0);
//     request.input("AssignTo",sql.NVarChar(255), AssignTo || null);
//     request.input("Attach",sql.NVARCHAR(255), Attach || null);

//     const result = await request.execute("InsertMessage");

//     res.status(200).json({
//       result: true,
//       message: "Message inserted successfully.",
//       data: result,
//       tokenValid: true,
//     });
//   } catch (error) {

//     console.error("Error inserting message:", error);
//     res.status(500).json({
//       result: false,
//       message: `Error inserting message: ${error.message}`,
//       tokenValid: true,
//     });
//   }
// };

//........new function forr insert mesage

// exports.insertMessage = async (req, res) => {
//   try {
//     const { Mid, SenderId, ReceiverId, Mtype, MsgSubject, Msg, isretailer, AssignTo, slipImage  } = req.body;

//     console.log("thos are the  body for ", req.body);

 
//     // if ( !MsgSubject || !Msg) {
//     //   return res.status(200).json({
//     //     result: false,
//     //     message: "Mtype, MsgSubject, and Msg are required.",
//     //     tokenValid: true,
//     //   });
//     // }


//     console.log("Uploaded file:", req.file);

//     const Attach = req.file ? path.join(req.file.filename) : null;
//     console.log("this is my Attachment  :-   ",Attach)


//     const poolConnection = await pool;
//     const request = poolConnection.request();

//     request.input("Mid", sql.Int, Mid || 0); 
//     request.input("SenderId", sql.NVarChar(100), SenderId || null);
//     request.input("ReceiverId", sql.NVarChar(100), ReceiverId || null);
//     request.input("Mtype", sql.NVarChar(50), Mtype);
//     request.input("MsgSubject", sql.NVarChar, MsgSubject);
//     request.input("Msg", sql.VarChar, Msg);
//     request.input("isretailer", sql.Int, isretailer || 0);
//     request.input("AssignTo", sql.NVarChar(255), AssignTo || null);
//     request.input("Attach", sql.NVarChar(255), Attach || null);

//     const result = await request.execute("InsertMessage");

//     res.status(200).json({
//       result: true,
//       message: "Message inserted successfully.",
//       data: result,
//       tokenValid: true,
//     });
//   } catch (error) {
//     console.error("Error inserting message:", error);
//     res.status(200).json({
//       result: false,
//       message: `Error inserting message: ${error.message}`,
//       tokenValid: true,
//     });
//   }
// };


//.......New  function for uplode Attached 

exports.insertMessage = async (req, res) => {
  try {
    const { Mid, SenderId, ReceiverId, Mtype, MsgSubject, Msg, isretailer, AssignTo , senderType} = req.body;

    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    // Handle file attachment
    const Attach = req.file ? path.join( req.file.filename) : null;
    console.log("Attachment path:", Attach);

    // Connect to the database
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Prepare SQL parameters
    request.input("Mid", sql.Int, Mid || 0);
    request.input("SenderId", sql.NVarChar(100), SenderId || null);
    request.input("ReceiverId", sql.NVarChar(100), ReceiverId || null);
    request.input("Mtype", sql.NVarChar(50), Mtype);
    request.input("MsgSubject", sql.NVarChar, MsgSubject);
    request.input("senderType", sql.NVarChar, senderType || 1);
    request.input("Msg", sql.VarChar, Msg);
    request.input("isretailer", sql.Int, isretailer || 0);
    request.input("AssignTo", sql.NVarChar(255), AssignTo || null);
    request.input("Attach", sql.NVarChar(255), Attach || null);

    // Execute the stored procedure
    const result = await request.execute("InsertMessage");

    res.status(200).json({
      result: true,
      message: "Message inserted successfully.",
      data: result.recordset,
      tokenValid: true,
    });
  } catch (error) {
    console.error("Error inserting message:", error);
    res.status(200).json({
      result: false,
      message: `Error inserting message: ${error.message}`,
      tokenValid: true,
    });
  }
};


//..............GET TICKET BY 4 FILTERETION ......................//

// exports.getMessages = async (req, res) => {
//   try {
//     const { FromDate, ToDate, SenderId, ReceiverId, Mtype, MsgSubject, isRead ,  Mid } = req.query;

//     console.log("get masage api calling with body ", req.query);

//     const poolConnection = await pool;
//     const request = poolConnection.request();

//     if (FromDate) request.input('FromDate', sql.DateTime, FromDate);
//     if (ToDate) request.input('ToDate', sql.DateTime, ToDate);
//     if (SenderId) request.input('SenderId', sql.NVarChar(100), SenderId);
//     if (ReceiverId) request.input('ReceiverId', sql.NVarChar(100), ReceiverId);
//     if (Mtype) request.input('Mtype', sql.NVarChar(50), Mtype);
//     if (MsgSubject) request.input('MsgSubject', sql.NVarChar(255), MsgSubject);
//     if (isRead !== undefined) request.input('isRead', sql.Int, isRead);
//     if (Mid) request.input('Mid', sql.Int, Mid);

//     const result = await request.execute('GetMessages');

//     //console.log("this is my result", result);

//     res.status(200).json({
//       message: 'Messages fetched successfully',
//       data: result.recordset,
//       tokenValid: true,
//     });
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     res.status(200).json({
//       message: `Error fetching messages: ${error.message}`,
//       tokenValid: true,
//     });
//   }
// };

//.............INSER TICKET ASSING CATEGORY ..............//

exports.insertTicketCategory = async (req, res) => {
  try {
    // Destructure request body
    const { Category, Username, IsActive } = req.body;

    // Validate input
    if (!Category || !Username) {
      return res.status(200).json({
        message: "Category and Username are required fields.",
        tokenValid: true,
        result: true,
      });
    }

    const poolConnection = await pool;
    const request = poolConnection.request();

    request.input("Category", sql.NVarChar(255), Category);
    request.input("Username", sql.NVarChar(255), Username);
    request.input("IsActive", sql.Bit, IsActive !== undefined ? IsActive : 1);

    const result = await request.execute(
      "InsertTicketAutoAssignCategoryMapping"
    );

    res.status(200).json({
      message: "Category inserted successfully",       
      data: result.recordset,
      tokenValid: true,
      result: true,
    });
  } catch (error) {
    console.error("Error inserting category:", error);
    res.status(200).json({
      message: `Error inserting category: ${error.message}`,
      tokenValid: true,
      result: true,
    });
  }
};

//....................END .....................//

//.........UPDATE IS OPEN FILDES  ........//
exports.toggleIsOpenField = async (req, res) => {
  try {

    const { Mid, isOpen } = req.body;


    if (!Mid || isOpen === undefined) {
      return res.status(400).json({
        message: "Mid and isOpen are required fields.",
        tokenValid: true,
        result: false,
      });
    }

    const poolConnection = await pool;
    const request = poolConnection.request();

    request.input("Mid", sql.Int, Mid);
    request.input("isOpen", sql.Bit, isOpen);

    const query = `UPDATE messagemst SET isOpen = @isOpen WHERE Mid = @Mid;`;
    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({
        message: `isOpen field updated successfully for Mid = ${Mid}`,
        data: result.rowsAffected,
        tokenValid: true,
        result: true,
      });
    } else {
      res.status(404).json({
        message: `No record found with Mid = ${Mid}`,
        tokenValid: true,
        result: false,
      });
    }
  } catch (error) {
    console.error("Error updating isOpen field:", error);
    res.status(500).json({
      message: `Error updating isOpen field: ${error.message}`,
      tokenValid: true,
      result: false,
    });
  }
};





//.............DELETE AND UPDATE CATEGORY ............//
exports.manageTicketCategory = async (req, res) => {
  try {
    const { action, Category, IsActive, username } = req.body;

    console.log("Request body:", req.body);

    if (!Category) {
      return res.status(200).json({
        message: "Category is a required field.",
        tokenValid: true,
        result: false,
      });
    }

    if (!["delete", "update"].includes(action)) {
      return res.status(200).json({
        message: "Invalid action. Allowed values are 'delete' or 'update'.",
        tokenValid: true,
        result: false,
      });
    }

    const poolConnection = await pool;
    const request = poolConnection.request();


    request.input("Category", sql.NVarChar(255), Category);

    if (action === "delete") {
    
      const query = `DELETE FROM TicketAutoAssignCategoryMapping WHERE Category = @Category;`;
      await request.query(query);

      return res.status(200).json({
        message: "Category deleted successfully.",
        tokenValid: true,
        result: true,
      });
    } 
    
    
    else if (action === "update") {
 
      if (IsActive === undefined || !username) {
        return res.status(200).json({
          message: "Both IsActive and username are required for the update action.",
          tokenValid: true,
          result: false,
        });
      }

      const usernameCheckQuery = `
        SELECT COUNT(1) AS UserExists
        FROM controlMst
        WHERE username = @username;
      `;
      const usernameCheckResult = await request
        .input("username", sql.NVarChar(255), username)
        .query(usernameCheckQuery);

      const userExists = usernameCheckResult.recordset[0].UserExists;
      console.log("userExist", userExists)
    

      if (!userExists) {
        return res.status(200).json({
          message: "The provided username does not exist in the controlMst table.",
          tokenValid: true,
          result: false,
        });
      }

      const updateQuery = `
        UPDATE TicketAutoAssignCategoryMapping
        SET 
            IsActive = @IsActive, 
            username = @username
        WHERE Category = @Category;
      `;

      request.input("IsActive", sql.Bit, IsActive);

      await request.query(updateQuery);

      return res.status(200).json({
        message: "Category updated successfully.",
        tokenValid: true,
        result: true,
      });
    }
  } catch (error) {
    console.error("Error managing category:", error);
    return res.status(200).json({
      message: `Error managing category: ${error.message}`,
      tokenValid: true,
      result: false,
    });
  }
};



//........GET ACTIV  CATEGORY..........//
exports.getActiveCategories = async (req, res) => {
  try {
    const {isActive} = req.body
 
  const poolConnection = await pool;
const request = poolConnection.request();

if (isActive !== undefined) {
  request.input('isActive', sql.Bit, isActive); 
}

const result = await request.query(`
  SELECT 
    srno, 
    Category, 
    username, 
    isActive 
  FROM TicketAutoAssignCategoryMapping
  ${isActive !== undefined ? 'WHERE isActive = @isActive' : ''}
  ORDER BY Category ASC
`);

  
  console.log("SQL QURY :- ", result)

    //const result = await request.query(query);

    // Respond with the fetched data
    res.status(200).json({
      message: "Active categories fetched successfully",
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching active categories:", error);
    res.status(200).json({
      message: `Error fetching active categories: ${error.message}`,
    });
  }
};

//........END ...........//

exports.getMessages = async (req, res) => {
  try {
    const {
      FromDate,
      ToDate,
      SenderId,
      ReceiverId,
      Mtype,
      MsgSubject,
      isRead,
      isOpen,
      ReceiverAndSenderId

    } = req.query;
    const Mid = req.query["Mid "] || req.query.Mid;

    console.log("GetMessages API called with query parameters:", req.query);


    const poolConnection = await pool;
    const request = poolConnection.request();

    // Add input parameters conditionally
    if (FromDate) request.input("FromDate", sql.DateTime, new Date(FromDate));
    if (ToDate) request.input("ToDate", sql.DateTime, new Date(ToDate));
    if (SenderId) request.input("SenderId", sql.NVarChar(100), SenderId);
    if (ReceiverId) request.input("ReceiverId", sql.NVarChar(100), ReceiverId);
    if (SenderId) request.input("SenderId", sql.NVarChar(100), SenderId);
    if (ReceiverAndSenderId) request.input("ReceiverAndSenderId", sql.NVarChar(100), ReceiverAndSenderId);

    if (Mtype) request.input("Mtype", sql.NVarChar(50), Mtype);
    if (MsgSubject) request.input("MsgSubject", sql.NVarChar(255), MsgSubject);
    if (isRead !== undefined) request.input("isRead", sql.Int, isRead);
    if (isOpen !== undefined) request.input("isOpen", sql.Int, isOpen);
    if (Mid) request.input("Mid", sql.Int, parseInt(Mid, 10));

    const result = await request.execute("GetMessages");

    console.log("Request Mid:", Mid);
    console.log("Result from procedure :", result);
    // Respond with the fetched data
    res.status(200).json({
      message: "Messages fetched successfully",
      data: result.recordset,
      tokenValid: true,
    });
  } catch (error) {
    // Log and handle errors
    console.error("Error fetching messages:", error);
    res.status(200).json({
      message: `Error fetching messages: ${error.message}`,
      tokenValid: true,
    });
  }
};

//...........function for edit isReade 0 , 1............//

exports.updateIsRead = async (req, res) => {
  try {
    const { MessageId, isRead } = req.body;

    if (!MessageId || isRead === undefined) {
      return res.status(400).json({
        message: "MessageId and isRead are required.",
      });
    }

    console.log("Update isRead API called with body: ", req.body);

    // Establish the connection pool
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Add input parameters
    request.input("MessageId", sql.Int, MessageId);
    request.input("isRead", sql.Int, isRead);

    // Execute the query
    const result = await request.query(`
      UPDATE MessageMst
      SET isRead = @isRead
      WHERE MessageId = @MessageId
    `);

    // Check rows affected
    if (result.rowsAffected[0] > 0) {
      res.status(200).json({
        message: "isRead field updated successfully.",
        tokenValid: true,
      });
    } else {
      res.status(404).json({
        message: "Message not found or no changes made.",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error updating isRead:", error);
    res.status(500).json({
      message: `Error updating isRead: ${error.message}`,
      tokenValid: true,
    });
  }
};

//.................... UPDATE THE TICKET OPEN OR CLOSE  WITH Mid ..............//
exports.updateIsOpen = async (req, res) => {
  try {
    const { Mid, isOpen } = req.body;

    if (!Mid || isOpen === undefined) {
      return res.status(200).json({
        message: "MId and isOpen are required.",
      });
    }

    console.log("Update isOpen API called with body: ", req.body);

    // Establish the connection pool
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Add input parameters
    request.input("Mid", sql.Int, Mid);
    request.input("isOpen", sql.Int, isOpen);

    // Execute the query
    const result = await request.query(`
      UPDATE MessageMst
      SET isOpen = @isOpen
      WHERE Mid = @Mid
    `);

    // Check rows affected
    if (result.rowsAffected[0] > 0) {
      res.status(200).json({
        message: "isOpen field updated successfully.",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        message: "Message not found or no changes made.",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error updating isRead:", error);
    res.status(200).json({
      message: `Error updating isRead: ${error.message}`,
      tokenValid: true,
    });
  }
};


// //.....................DASHBORD DATA ...........//
exports.getDashboardData = async (req, res) => {
  try {
    const poolConnection = await pool;
    const request = poolConnection.request();

    // Execute the stored procedure
    const result = await request.execute("GetDashboardData");

    // Parse results from the stored procedure
    const data = {
      totalUsers: result.recordsets[0]?.[0]?.TotalUsers || 0,
      usersByMonth: result.recordsets[1] || [],
      userStatus: {
        activeUsers: result.recordsets[2]?.[0]?.ActiveUsers || 0,
        deactivatedUsers: result.recordsets[2]?.[0]?.DeactivatedUsers || 0,
      },
      totalWalletBalance: result.recordsets[3]?.[0]?.TotalWalletBalance || 0,
      totalRechargeAmount: result.recordsets[4]?.[0]?.TotalRechargeAmount || 0,
      monthlyRechargeAmounts: result.recordsets[5] || [],
      totalComplaints: result.recordsets[6]?.[0]?.TotalComplaints || 0,
    };

    res.status(200).json({
      result: true,
      message: "Dashboard data retrieved successfully.",
      data,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(200).json({
      result: false,
      message: `Error fetching dashboard data: ${error.message}`,
    });
  }
};

//.................... get Recharge Summary ........................//
exports.getRechargeSummary = async (req, res) => {
  const { fromDate, toDate } = req.body;
  console.log("Received data from req.body:", req.body);

  try {
    console.log("Executing GetRechargeSummary procedure...");
    const poolConnection = await pool;
    const result = await poolConnection
      .request()
      .input("fromDate", fromDate || null)
      .input("toDate", toDate || null)
      .execute("GetRechargeSummary");

    const summaryData = result.recordset;
    console.log("Response data from procedure:", summaryData);

    if (summaryData.length > 0) {
      const data = summaryData.reduce((acc, item) => {
        const { Item_Desc, Amount, NoofUser } = item;
        acc[Item_Desc] = { Amount, NoofUser, Item_Desc };
        return acc;
      }, {});

      res.status(200).json({
        result: true,
        data,
        message: "Recharge summary retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No data found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetRechargeSummary procedure:", error);
    res.status(500).json({
      result: false,
      message: "Database error during recharge summary retrieval",
      tokenValid: true,
    });
  }
};

//..............getRecharge Summery forter data
exports.getRechargeDetailsSummery = async (req, res) => {
  const { fromDate, toDate, type } = req.body;
  console.log("Request body data:", req.body, "type", type);
  
  try {
    console.log("Executing GetRechargeDetails procedure...");
    const poolConnection = await pool; 

    const result = await poolConnection
      .request()
      .input("fromDate", fromDate || null)
      .input("toDate", toDate || null)
      .input("type", type || null)
      .execute("GetRechargeDetailsSummary");

    const detailedData = result.recordset;

    console.log("Response from procedure:", detailedData);

    if (detailedData && detailedData.length > 0) {
 
      const mobileRecharges = detailedData.filter(
        (item) => item.Item_Desc === `${type}`
      );

      const totalRechargeAmount = mobileRecharges.reduce(
        (sum, item) => sum + (item.Amount || 0),
        0
      );
      const countMobileRecharges = mobileRecharges.length;

      res.status(200).json({
        result: true,
        data: mobileRecharges,
        TOTAL: totalRechargeAmount, 
        COUNT: countMobileRecharges, 
        message: "Recharge details retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        data: [],
        TOTAL: 0, 
        COUNT: 0, 
        message: "No recharge details found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetRechargeDetails procedure:", error);
    res.status(500).json({
      result: false,
      message: "Database error during recharge details retrieval",
      tokenValid: true,
    });
  }
};


//--------------------------GET USER  DETALS TOFROM DATE.............//

exports.getActiveUsers = async (req, res) => {
  const { fromDate, toDate, AppMstPaid } = req.body;

  console.log("Request body data:", req.body);

  try {
    console.log("Executing GetActiveUsers procedure...");
    const poolConnection = await pool;

    const result = await poolConnection
      .request()
      .input("fromDate", fromDate || null)
      .input("toDate", toDate || null)
      .input("AppMstPaid", sql.Int, AppMstPaid ||null)
      .execute("GetActiveUsers");

    const activeUsers = result.recordset;

    console.log("Procedure result:", activeUsers);

    if (activeUsers.length > 0) {
      res.status(200).json({
        result: true,
        data: activeUsers,
        message: "Active users retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No active users found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetActiveUsers procedure:", error);
    res.status(200).json({
      result: false,
      message: "Database error during active users retrieval",
      tokenValid: true,
    });
  }
};

//................Get user getals summmary ...............//
exports.getUserSummary = async (req, res) => {
  const { fromDate, toDate, AppMstPaid } = req.body;

  console.log("Request body data:", req.body);

  try {
    console.log("Executing GetUserSummary procedure...");
    const poolConnection = await pool;

    const result = await poolConnection
      .request()
      .input("fromDate", fromDate || null)
      .input("toDate", toDate || null)
      .input("AppMstPaid", sql.Int, AppMstPaid || null)
      .execute("GetUserSummary");

    const summaryData = result.recordset[0];

    console.log("Procedure result:", summaryData);

    if (summaryData) {
      res.status(200).json({
        result: true,
        data: summaryData,
        message: "User summary retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No data found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetUserSummary procedure:", error);
    res.status(200).json({
      result: false,
      message: "Database error during user summary retrieval",
      tokenValid: true,
    });
  }
};

//................GET TOP SERVISE  BY NOOFUSER AND  AMOUNT .............//

exports.getTopRechargeItems = async (req, res) => {
  const { topN, orderBy, fromDate, toDate } = req.body;

  console.log("Request body data:", req.body);

  try {
    console.log("Executing GetTopRechargeItems procedure...");
    const poolConnection = await pool; // Assuming `pool` is already configured in your `db.js`

    // Execute the stored procedure with inputs
    const result = await poolConnection
      .request()
      .input("TopN", sql.Int, topN || 10) // Default to top 10 if not provided
      .input("OrderBy", orderBy || "Amount") // Default to "Amount"
      .input("FromDate", fromDate || null)
      .input("ToDate", toDate || null)
      .execute("GetTopRechargeItems");

    const rechargeItems = result.recordset;

    console.log("Procedure result:", rechargeItems);

    if (rechargeItems && rechargeItems.length > 0) {
      res.status(200).json({
        result: true,
        data: rechargeItems,
        message: "Top recharge items retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No data found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetTopRechargeItems procedure:", error);
    res.status(200).json({
      result: false,
      message: "Database error during recharge items retrieval",
      tokenValid: true,
    });
  }
};


//..............FUNCTION  FOR GET KYC OVERVEW B/W  TODATE  AND  FROM DATTE 

exports.getKycOverview = async (req, res) => {
  const { fromDate, toDate } = req.body; 

  console.log("Request body data:", req.body);

  try {
    console.log("Executing GetKYCOverview procedure...");
    const poolConnection = await pool; 

    const result = await poolConnection
      .request()
      .input("FromDate", fromDate || null) 
      .input("ToDate", toDate || null) 
      .execute("GetKYCOverview"); 

    const kycOverview = result.recordset;

    console.log("Procedure result:", kycOverview);

    if (kycOverview && kycOverview.length > 0) {
      res.status(200).json({
        result: true,
        data: kycOverview,
        message: "KYC overview retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No data found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetKYCOverview procedure:", error);
    res.status(200).json({
      result: false,
      message: "Database error during KYC overview retrieval",
      tokenValid: true,
    });
  }
};



//................KYC SUMMERY  DETALS..................//

exports.getUserKycDetails = async (req, res) => {
  const { fromDate, toDate, kycType } = req.body; // Including kycType for filtering

  console.log("Request body data:", req.body);

  try {
    console.log("Executing getUserKycDetails procedure...");
    const poolConnection = await pool;

    const result = await poolConnection
      .request()
      .input("FromDate", fromDate || null) // Pass FromDate or null
      .input("ToDate", toDate || null) // Pass ToDate or null
      .input("KycType", kycType || null) // Pass KycType or null for optional filtering
      .execute("getUserKycDetails"); // Execute the updated procedure

    const kycDetails = result.recordset;

    console.log("Procedure result:", kycDetails);

    if (kycDetails && kycDetails.length > 0) {
      res.status(200).json({
        result: true,
        data: kycDetails,
        message: "KYC details retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        data: [],
        message: "No data found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing getUserKycDetails procedure:", error);
    res.status(500).json({
      result: false,
      message: "Database error during KYC details retrieval",
      tokenValid: true,
    });
  }
};


//............... STATE WISE  RECHARGE  .......//
exports.getRechargeStatsByState = async (req, res) => {
  const { fromDate, toDate } = req.body;
  console.log("Request body data:", req.body);

  try {
  
    const poolConnection = await pool;

    const result = await poolConnection
      .request()
      .input("fromDate", fromDate || null)
      .input("toDate", toDate || null)
      .execute("GetRechargeStatsByState");

    const rechargeStats = result.recordset;

    console.log("Procedure result:", rechargeStats);

    if (rechargeStats && rechargeStats.length > 0) {
   
      const totalRechargeAmount = rechargeStats.reduce(
        (sum, state) => sum + (state.TotalRechargeAmount || 0),
        0
      );

      res.status(200).json({
        result: true,
        data: rechargeStats,
        TOTAL: totalRechargeAmount, 
        message: "Recharge statistics retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        data: [],
        TOTAL: 0, 
        message: "No data found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetRechargeStatsByState procedure:", error);
    res.status(200).json({
      result: false,
      message: "Database error during recharge statistics retrieval",
      tokenValid: true,
    });
  }
};


//-------------------PAGE PERMITION API -----------------//
exports.checkPagePermission = async (req, res) => {
  try {
    const user = req.admin;
    const userid = user.username; 
    const { pageName } = req.body;

    console.log("Request data:", { userid, pageName });

    if(userid ==="admin"){
      return res.status(200).json({
        result: true,
        message: "Admin has permission for All the page.",
        tokenValid: true,
      });
    }


    if (!userid || !pageName) {
      return res.status(200).json({
        result: false,
        message: "Both userid and pageName are required fields.",
        tokenValid: true,
      });
    }


    const poolConnection = await pool;
    const request = poolConnection.request();

    request.input("userid", sql.VarChar(30), userid);
    request.input("pageName", sql.VarChar(100), pageName);

    const result = await request.execute("CheckPagePermission");

    console.log("Procedure result:=========",result.recordset);

    if (result.recordset.length > 0) {
      const { permission } = result.recordset[0];
      //console.log("print permition ", result.recordset)

      if (permission === 1) {
        return res.status(200).json({
          result: true,
          message: "User has permission for the page.",
          tokenValid: true,
        });
      } else if  (permission === 0) {
        return res.status(200).json({
          result: false,
          message: "User does not have permission for the page.",
          tokenValid: true,
        });
      }

    } 
    else  {
      return res.status(200).json({
        result: true,
        message: "User has permission for the page.123",
        tokenValid: true,
      });
    }

  } catch (error) {
    console.error("Error executing CheckPagePermission:", error.message);
    return res.status(200).json({
      result: false,
      message: `Error checking page permission: ${error.message}`,
      tokenValid: true,
    });
  }
};


//---------------GET  TOTAL  DESTRIBUTED  AMOUNT FROM BADMIN TO  USERS 
exports.getRechargeLogsSummary = async (req, res) => {
  const { fromDate, toDate } = req.body; 


  try {
    console.log("Executing GetRechargeLogsSummary procedure...");
    const poolConnection = await pool; 
 
    const result = await poolConnection
      .request()
      .input("fromDate", sql.VarChar(10), fromDate || null) 
      .input("toDate", sql.VarChar(10), toDate || null)    
      .execute("GetRechargeLogsSummary");

    const rechargeDetails = result.recordsets[0];

    const summaryTotals = result.recordsets[1][0]; 

    console.log("Procedure results:", { rechargeDetails, summaryTotals });

    if (rechargeDetails && rechargeDetails.length > 0) {
      res.status(200).json({
        result: true,
        data: {
          rechargeDetails,
          summaryTotals,
        },
        message: "Recharge logs summary retrieved successfully",
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: "No data found for the given parameters",
        tokenValid: true,
      });
    }
  } catch (error) {
    console.error("Error executing GetRechargeLogsSummary procedure:", error);
    res.status(500).json({
      result: false,
      message: "Database error during recharge logs summary retrieval",
      tokenValid: true,
    });
  }
};
