const sql = require('mssql');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const axios = require("axios");

require('dotenv').config();


const JWT_SECRET = process.env.JWT_SECRET;

const username =process.env.USERNAME2;
const token = process.env.PDRS_TOKEN;


//STAPE1 :- Update User detals in KYC  with using Procedure - insertmodifyprofile

// insert user detalse in KYC function 
exports.insertUser = async (req, res) => {
  const user=req.user 
  const modifiedBy = user.userId
  console.log("this is for user data", user , "modifiedBy", modifiedBy);
    try {
     
      const { 
        appmstRegNo, title1, fname1, Address1, City1, State1, distt1, PinCode1, 
        PrimaryPhone1 = '', Mobile1, nomname1, nomrela1, userdob1, activate1, 
        email1, GName1, Mname1, Gender, GTitle1, EPassword = '', pswrd = ''
      } = req.body;

      console.log("this is insert  data in body ", req.body);
      const poolConnection = await pool;
  
      // Call the stored  procedure :- "insertmodifyprofile" with the correct parameters

      const result = await poolConnection.request()
        .input('modifiedby', sql.VarChar(50), modifiedBy ||'')
        .input('appmstregno', sql.VarChar(50), appmstRegNo ||'')
        .input('title1', sql.NVarChar(50), title1 ||'')
        .input('fname1', sql.NVarChar(100), fname1)
        .input('Address1', sql.VarChar(100), Address1)
        .input('City1', sql.NVarChar(100), City1)
        .input('State1', sql.NVarChar(200), State1)
        .input('distt1', sql.VarChar(50), distt1)
        .input('PinCode1', sql.NVarChar(100), PinCode1)
        .input('PrimaryPhone1', sql.NVarChar(100), PrimaryPhone1)
        .input('Mobile1', sql.VarChar(50), Mobile1)
        .input('nomname1', sql.VarChar(50), nomname1)
        .input('nomrela1', sql.VarChar(50), nomrela1)
        .input('userdob1', sql.DateTime, userdob1)
        .input('activate1', sql.Int, activate1)
        .input('email1', sql.VarChar(50), email1)
        .input('GName1', sql.NVarChar(100), GName1)
        .input('Mname1', sql.VarChar(50), Mname1)
        .input('Gender', sql.Int, Gender)
        .input('GTitle1', sql.VarChar(50), GTitle1)
        .input('EPassword', sql.VarChar(50), EPassword)
        .input('pswrd', sql.VarChar(50), pswrd)
        .output('flag', sql.VarChar(100)) 
        .execute('insertmodifyprofile'); 
  
      const outputFlag = result.output.flag; 
      console.log("this is my output data ",outputFlag);
  
      if (outputFlag === '1') {
        res.status(200).json({
          result: true,
          data: result.recordset,
          message: 'User data updated successfully',
          tokenValid: true,
        });
      } else {
        res.status(200).json({
          result: false,
          message: outputFlag || 'An error occurred',
          tokenValid: true,
        });
      }
    } catch (error) {
      console.error('Error calling insertmodifyprofile:', error);
      res.status(200).json({
        result: false,
        message: 'An error occurred while updating user data',
        tokenValid: true,
      });
    }
  };






//GET state  functio using  procedure :- [getstate]
exports.getState = async (req, res) => {
  try {
    const poolConnection = await pool;
    const result = await poolConnection.request()
      .execute('getstate');

    res.status(200).json({
      result: true,
      data: result.recordset,  // Return the data from the procedure
      message: 'States retrieved successfully',
      tokenValid: true
    });

  } catch (err) {
    console.error('Error executing getstate:', err);
    res.status(200).json({
      result: false,
      message: 'An error occurred while retrieving states',
      tokenValid: true,
    });
  }
};



//GET DISTRICT BASE ON SATATE NAME 
exports.getStateDistrict = async (req, res) => {
  try {
    const { state } = req.body; 

    if (!state) {
      return res.status(200).json({
        result: false,
        message: 'State parameter is missing',
        tokenValid: true,
      });
    }

    const poolConnection = await pool;
    const result = await poolConnection.request()
      .input('state', state) 
      .execute('GetStateDistrict'); 


    res.status(200).json({
      result: true,
      data: result.recordset,  
      message: 'Districts retrieved successfully',
      tokenValid: true
    });

  } catch (err) {
    console.error('Error executing GetStateDistrict:', err);
    res.status(200).json({
      result: false,
      message: 'An error occurred while retrieving districts',
      tokenValid: true
    });
  }
};



//UPLODE PAN and update  for kyc process 
exports.kycForPAB = async (req, res) => {
  const {
    regno, image, bankimage, bankstatus, BankName, AccountName, BankACNo, Branch,
    IFSCCode, AF, AB, value, action, imagename, AFImg, ABImg, UpdateBy, modifiedby
  } = req.body;

  console.log("req.boy", req.body)
  try {
    const poolConnection = await pool;

    
    const result = await poolConnection.request()
      .input('regno', regno)
      .input('image', image || '') 
      .input('bankimage', bankimage || '')
      .input('bankstatus', bankstatus || null)
      .input('BankName', BankName || '')
      .input('AccountName', AccountName || '')
      .input('BankACNo', BankACNo || '')
      .input('Branch', Branch || '')
      .input('IFSCCode', IFSCCode || '')
      .input('AF', AF || '')
      .input('AB', AB || '')
      .input('value', value || '')
      .input('action', action) // 'BANK', 'AADHAR', or 'PAN'
      .input('UpdateBy', UpdateBy || '')
      .output('imagename', sql.VarChar(50)) 
      .output('AFImg', sql.VarChar(500))    
      .output('ABImg', sql.VarChar(500))     
      .output('flag', sql.VarChar(50))      
      .output('modifiedby', sql.VarChar(50)) 
      .execute('MasterDocUploadProcedure');  

   
    const output = result.output;

    console.log('this is my output from procedure ',output );
    
    if (output.flag === '1') {
      res.status(200).json({
        result: true,
        message: 'KYC details processed successfully',
        data:output,
        tokenValid: true,

      });
    } else {
      res.status(200).json({
        result: false,
        message: `An error occurred: ${output.flag}`,
        tokenValid: true
      });
    }

  } catch (error) {
    console.error('Error executing MasterDocUploadProcedure:', error);
    res.status(200).json({
      result: false,
      message: 'An error occurred while processing KYC details',
      tokenValid: true
    });
  }
};




// Get Approved PAN List
// exports.getApprovalList = async (req, res) => {
//   const { Action , Fromdate , Todate , Userid , status } = req.body;

//   try {
//     const poolConnection = await pool; 
//     const result = await poolConnection
//       .request()
//       .input('Action', sql.VarChar(50), Action)
//       .input('Fromdate', sql.VarChar(20), Fromdate)
//       .input('Todate', sql.VarChar(20), Todate)
//       .input('Userid', sql.VarChar(30), Userid)
//       .input('status', sql.Int, status)
//       .execute('GetUserKycList');

//     // Check if result is valid and send response
//     if (result.recordset.length > 0) {
//       res.status(200).json({
//         result: true,
//         message: `Approved ${Action} records fetched successfully`,
//         data: result.recordset,
//         tokenValid: true
//       });
//     } else {
//       res.status(200).json({
//         result: false,
//         message: `No approved ${Action} records found`,
//         tokenValid: true
//       });
//     }
//   } catch (error) {
//     console.error(`Error fetching approved ${Action} list:`, error);
//     res.status(200).json({
//       result: false,
//       message: `An error occurred while fetching approved ${Action} records`,
//       tokenValid: true
//     });
//   }
// };



//GeT Approved List
exports.getApprovalList = async (req, res) => {


  try {

    const { Action, Fromdate, Todate, Userid, status } = req.body;
    console.log("API call started: getApprovalList");

    console.log("Input values set:");
    console.log("Action:", Action);
    console.log("Fromdate:", Fromdate);
    console.log("Todate:", Todate);
    console.log("Userid:", Userid || "No User ID provided");
    console.log("Status:", status);

    console.log("Attempting to establish database connection...");
    const poolConnection = await pool;
    console.log("Database connection established successfully");

    console.log("Preparing to execute stored procedure: GetUserKycList");
    const result = await poolConnection
      .request()
      .input('Action', sql.VarChar(50), Action)
      .input('Fromdate', sql.VarChar(20), Fromdate)
      .input('Todate', sql.VarChar(20), Todate)
      .input('Userid', sql.VarChar(30), Userid)
      .input('status', sql.Int, status)
      .execute('GetUserKycList');

    console.log("Stored procedure executed successfully");
    console.log("Raw result from database:", result);

    if (result.recordset && result.recordset.length > 0) {
      console.log("Records found:", result.recordset.length);
      res.status(200).json({
        result: true,
        message: `Approved ${Action || 'records'} fetched successfully`,
        data: result.recordset,
        tokenValid: true,
      });
      console.log("Response sent with data");
    } else {
      console.log("No records found for the given criteria");
      res.status(200).json({
        result: false,
        message: `No approved ${Action || 'records'} found`,
        tokenValid: true,
      });
      console.log("Response sent with no records message");
    }
  } catch (error) {
    console.error("Error during API execution:", error.message);
    res.status(200).json({
      result: false,
      message: `An error occurred while fetching approved ${Action || 'records'}`,
      tokenValid: true,
    });
  }
};





//..............UPLODE BANK DETAILS  FUNCTION ...........//

exports.uploadBankDetails = async (req, res) => {
  const { regno, BankName, type, BankACNo, Branch, IFSCCode } = req.body;
  console.log("Bank details upload request body:", req.body);
  //const user = req.admin ;
  //const UpdateBy = user.userRole; 
  const UpdateBy = "admin"
  try {
    const bankimage = req.file ? path.join(req.file.filename) : '';  
// Get uploaded Bank image path
    console.log(`Bank Image path: api.triptelspay.com/public/${bankimage}`);

    const poolConnection = await pool;
    const result = await poolConnection.request()

   
      .input('regno', sql.VarChar(50), regno)
      .input('action', sql.VarChar(50), 'BANK') 
      .input('BankName', sql.VarChar(60), BankName)
      .input('type', sql.VarChar(60), type)
      .input('BankACNo', sql.VarChar(50), BankACNo)
      .input('Branch', sql.VarChar(60), Branch)
      .input('IFSCCode', sql.VarChar(80), IFSCCode)
      .input('bankimage', sql.VarChar(100), bankimage)  
      .input('UpdateBy', sql.VarChar(50), UpdateBy || "admin")
      
      .output('flag', sql.VarChar(50)) 
      .execute('MasterDocUploadProcedure');

    const output = result.output;
    if (output.flag === '1') {  
      res.status(200).json({
        result: true,
        message: 'Bank details processed successfully',
        data: output,
        tokenValid: true
      });
    } else {
      res.status(200).json({
        result: false,
        message: `An error occurred: ${output.flag}`,
        tokenValid: true
      });
    }
  } catch (error) {
    console.error('Error in Bank details upload:', error);
    res.status(200).json({
      result: false,
      message: 'An error occurred while processing bank details',
      tokenValid: true
    });
  }
};







//............UPLODE PNA DETALSE FUNCTION ................//

exports.uploadPanDetails = async (req, res) => {
  const { regno, PanNumber } = req.body;
  console.log("PAN details upload request body:", req.body);

  const UpdateBy = "admin";  
  try {
    const panImage = req.file ? path.join(req.file.filename) : ''; 
    console.log(`PAN Image path: api.triptelspay.com/public/${panImage}`);

    const poolConnection = await pool;
    const result = await poolConnection.request()

      // Input parameters
      .input('regno', sql.VarChar(50), regno)
      .input('action', sql.VarChar(50), 'PAN')  
      .input('Panno', sql.VarChar(50), PanNumber)
      .input('panimage', sql.VarChar(100), panImage) 
      .input('UpdateBy', sql.VarChar(50), UpdateBy)

    
      .output('flag', sql.VarChar(50)) 

      .execute('MasterDocUploadProcedure');

    const output = result.output;
    if (output.flag === '1') { 
      res.status(200).json({
        result: true,
        message: 'PAN details processed successfully',
        data: output,
        tokenValid: true
      });
    } else {
      res.status(200).json({
        result: false,
        message: `An error occurred: ${output.flag}`,
        tokenValid: true
      });
    }
  } catch (error) {
    console.error('Error in PAN details upload:', error);
    res.status(200).json({
      result: false,
      message: 'An error occurred while processing PAN details',
      tokenValid: true
    });
  }
};





//............UPLODE AADHAR DETALS .....................//
exports.uploadAadhaarDetails = async (req, res) => {
  // const { regno, AadhaarNumber } = req.body;
  const { regno, AadhaarNumber } = req.body;

  console.log("Aadhaar details upload request body:", req.body);

  const UpdateBy = "admin";  
  try {
  
    const aadharfront = req.files?.aadharfront ? req.files.aadharfront[0].filename : '';
    const aadharback = req.files?.aadharback ? req.files.aadharback[0].filename : '';

    console.log(`Aadhaar Front Image path: ${aadharfront}`);
    console.log(`Aadhaar Back Image path:${aadharback}`);
    console.log("regno", regno, "AadharNo",AadhaarNumber );


    const poolConnection = await pool;
    const result = await poolConnection.request()


      .input('regno', sql.VarChar(50), regno)
      .input('action', sql.VarChar(50), 'AADHAR')  
      .input('AadharNo', sql.VarChar(50), AadhaarNumber)
      .input('aadharfront', sql.VarChar(100), aadharfront)  
      .input('aadharback', sql.VarChar(100), aadharback)   
      .input('UpdateBy', sql.VarChar(50), UpdateBy)

      .output('flag', sql.VarChar(50))  

      .execute('MasterDocUploadProcedure');

    const output = result.output;

    console.log("this is my result ", output);

    if (output.flag === '1') {  
      res.status(200).json({
        result: true,
        message: 'Aadhaar details processed successfully',
        data: output,
        tokenValid: true,
      });
    } else {
      res.status(200).json({
        result: false,
        message: `An error occurred: ${output.flag}`,
        tokenValid: true
      });
    }
  } catch (error) {
    console.error('Error in Aadhaar details upload:', error);
    res.status(200).json({
      result: false,
      message: 'An error occurred while processing Aadhaar details',
      tokenValid: true
    });
  }
};









//APROVED  API FOR PAN AADHAR AND BANK 

exports.approveKYCDetails = async (req, res) => {
  const { regno, action, status } = req.body;
 
  const UpdateBy = "admin"; 
  console.log("KYC approval request:", req.body);



  try {
    const poolConnection = await pool;
    const result = await poolConnection.request()

      // Input parameters
      .input('regno', sql.VarChar(50), regno)
      .input('action', sql.VarChar(50), action)  // 'BANK', 'PAN', 'AADHAR'
      .input('status', sql.Int, status)  // 1 for approve, 3 for reject
      .input('UpdateBy', sql.VarChar(50), UpdateBy)

      .output('flag', sql.VarChar(50))  

      .execute('User_KYC_Reje_Appr');

    const outputFlag = result.output.flag;

    console.log("ouput flag", outputFlag);

    if (outputFlag === '1') {
      let actionText = '';
      if (action === 'PAN') actionText = 'PAN';
      else if (action === 'BANK') actionText = 'Bank';
      else if (action === 'AADHAR') actionText = 'Aadhaar';

      const statusText = status == 1 ? 'approved' : 'rejected';
      // console.log("action text ", actionText, "status Text",  statusText);
      // console.log(`${statusText} details ${statusText} successfully`,)


      res.status(200).json({
        result: true,
        message: `${actionText} details ${statusText} successfully`,
        tokenValid: true
      });
    } else {
      res.status(200).json({
        result: false,
        message: `An error occurred: ${outputFlag}`,
        tokenValid: true
      });
    }
  } 

   catch (error) {
    console.error('Error in KYC approval:', error);
    res.status(200).json({
      result: false,
      message: 'An error occurred while processing KYC approval',
      tokenValid: true
    });
  }
};









//API for PAN Verification 
exports.panKycVerification = async (req, res) => {
  const { pan } = req.body;
  console.log("PAN VERIFY API CALLING", req.body);

  try {
      const response = await axios.get(`https://pdrs.online/API2/AdharVerification_get_otp`, {
          params: {
              username: '8093073099',
              password: '249327',
              token: '617301924407158903058226494669',
              //aadhaar_number: aadhaar_number,
              pan:pan
          }
      });


      if (response.data.code === 100) { // Assuming 100 means success
        // Connect to the database
        let pool = await sql.connect(dbConfig);

        // Update the state to 'approved' in the database
        await pool.request()
            .input('ClientID', sql.VarChar, client_id)
            .input('Status', sql.VarChar, 'approved')
            .execute('UpdateStateProcedure'); // Replace with the actual procedure name

        // Log the approval in the database
        await pool.request()
            .input('ClientID', sql.VarChar, client_id)
            .input('Status', sql.VarChar, 'approved')
            .input('Timestamp', sql.DateTime, new Date())
            .execute('LogApprovalProcedure'); // Replace with the actual procedure name for logging

        res.status(200).json({ message: 'OTP validated and state updated to approved', data: response.data.result , tokenValid: true});
    } else {
        res.status(200).json({ message: 'OTP validation failed', data: response.data, tokenValid: true });
    }
  } catch (error) {
      res.status(200).json({ error: error.message, tokenValid: true });
  }
};




//..................PDRS AADHAR KYC ...................................//

exports.aadhaarKycVerification = async (req, res) => {
  const { aadhaar_number } = req.body;
  console.log("AADHAR VERIFY API CALLING ", req.body);

  try {
      const response = await axios.get(`https://pdrs.online/API2/AdharVerification_get_otp`, {
          params: {
              username: '8093073099',
              password: '249327',
              token: '617301924407158903058226494669',
              aadhaar_number: aadhaar_number
          }
      });

      res.status(200).json(response.data);
  } catch (error) {
      res.status(500).json({ error: error.message, tokenValid: true });
  }
};


      
// ...................Endpoint for validating OTP...................................//

exports.aadharOTPsub = async (req, res) => {
  console.log("aadharOTPsub API calling +++");
   const { client_id, otp, mobile_number } = req.body;
   const user = req.user;
  
   
   try {
       const response = await axios.get(`https://pdrs.online/API2/AdharVerification_submit_otp`, {

        //https://pdrs.online/webapi/Aadhar_v2/Verify
           params: {
               username: '8093073099',
               password: '249327',
               token: '617301924407158903058226494669',
               client_id: client_id,
               otp: otp,
               mobile_number: mobile_number
           }
       });
/////////////

if (response.data.code == 100 && response.data.result.success) {
  //     console.log("i am in if block for data store in tbl ++++");

         const aadhaar_number = response.data.result.data.aadhaar_number;
         const AadharDetails = response.data.result.data;
         const appmstregno = "8383015513";

     
         

              //res.status(200).json({appmstregno: appmstregno,aadhaar_number: aadhaar_number,AadharDetails: AadharDetails });


  //     // Step 2: Store Aadhar details in database if validation was successful

       const poolConnection = await pool;
       const result = await poolConnection.request()
         .input('appmstregno', sql.VarChar(50), appmstregno || "6295750823")
         .input('AadharNo', sql.VarChar(50), aadhaar_number || "347694614458")
         .input('AadharDetails', sql.VarChar(sql.MAX), AadharDetails || " ")
         .input('Astatus', sql.VarChar(100), Astatus || "1")
         .output('strResult', sql.VarChar(sql.MAX))
         .execute("Update_AadhrVerify_online");


       const strResult = result.output.strResult;
  //   console.log("this is res from procedure ",result.output );

       if (strResult === '1') {
         res.status(200).json({ success: true, message: 'Aadhar verification updated successfully', data: AadharDetails , tokenValid: true     });
       } else {
         res.status(200).json({ success: false, message: 'User not found or other error occurred', data: AadharDetails , tokenValid: true     });
       }

        } else {
           //Step 2: Handle OTP validation failure without storing data
           res.status(200).json({ success: false, message: 'OTP validation failed' , tokenValid: true});
       }

/////////////


       res.status(200).json(response.data);
   } catch (error) {
       res.status(200).json({ error: error.message , tokenValid: true}); // Changed status to 500 for error
   }
};