
const express = require('express');
const KycController = require('../controllers/KycControllers');
const auth  =require("../middlewares/authenticat");
const authorize = require("../middlewares/authorize");
const upload  = require("../middlewares/multerMW");
const uploadPaySlip = require("../middlewares/amountReqMW");
const uploadAadhaarMw = require("../middlewares/uplodeImgMW");

const kycRouter = express.Router();

kycRouter.post("/insertUser",KycController.insertUser);
kycRouter.get("/getState",KycController.getState);
kycRouter.post("/getDistrict",KycController.getStateDistrict);
kycRouter.post("/getApprovalList", uploadPaySlip.single("slipImage") , KycController.getApprovalList);

 

//uplode kyc docs with Admin side 
kycRouter.post("/uplodeBank",authorize,uploadPaySlip.single("slipImage"),  KycController.uploadBankDetails);
kycRouter.post("/uplodePan",authorize,uploadPaySlip.single("slipImage"), KycController.uploadPanDetails);
kycRouter.post("/uploadAadhaar",authorize, uploadAadhaarMw, KycController.uploadAadhaarDetails);

//This  route  dedicated  for approve KYC details
kycRouter.post("/approveKYCDetails", KycController.approveKYCDetails);

//Aadhar Pdrs online KYC 
kycRouter.get("/aadharVotp", KycController.aadhaarKycVerification);
kycRouter.get("/aadharOTPsub",auth , KycController.aadharOTPsub);
kycRouter.get("/panKycVerification", KycController.panKycVerification);


//user uplode Route  pan , adhar ,bank 
kycRouter.post("/useruplodeBank",auth, uploadPaySlip.single("slipImage"),  KycController.uploadBankDetails);
kycRouter.post("/useruplodePan",auth, uploadPaySlip.single("slipImage"), KycController.uploadPanDetails);
kycRouter.post("/useruploadAadhaar", auth, uploadAadhaarMw, KycController.uploadAadhaarDetails);
kycRouter.post("/userinsertUser",auth ,KycController.insertUser);


// kycRouter.post("/kycForPAN", uploadPaySlip.single("slipImage") , KycController.uploadPAN);
// kycRouter.post("/sendSms",KycController.sendSms );


module.exports = kycRouter;  