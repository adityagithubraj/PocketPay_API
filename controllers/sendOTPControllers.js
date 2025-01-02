const axios = require('axios');
const express = require('express');
const router = express.Router();
require('dotenv').config();


const username = process.env.USERNAME2
const token = process.env.PDRS_TOKEN 
const otpsendUrl  =process.env.OTPSEND_URL
const password = digimile

// Function to send OTP dynamically

exports.OTP = async (req, res) => {
  try {
    const { otp, number, order_id } = req.body;
    console.log("fron send OTP function body", req.body);
    
    // Validate required fields
    if (!otp || !number || !order_id) {
      return res.status(400).json({
        result: false,
        message: 'Missing required fields: otp, number, or order_id',
      });
    }
const otpsendUrl =`https://rslri.connectbind.com:8443/bulksms/bulksms?username=${username}&password=digimile&type=0&dlr=1&destination=6295750823&source=TPLPAY&message=OTP 757575 for Transaction and valid for 15 min from : DKJDKDID Triptales&entityid=1101530690000082077&tempid=1107172897733024934`
  //const otpUrl=`https://rslri.connectbind.com:8443/bulksms/bulksms?username=${username}&password=${token}&otp=${otp}&number=${number}&order_id=${order_id}`;
  //const otpUrl = otpsendUrl
  console.log(".env otp send URL==",otpUrl );
    // Make the API request to send OTP
    const response = await axios.get(otpsendUrl);
    const responseData = response.data;

    // Return success or failure response
    if (responseData.status === 'Success') {
      return res.status(200).json({
        result: true,
        message: 'OTP sent successfully',
        data: responseData,
      });
    } else {
      return res.status(500).json({
        result: false,
        message: 'Failed to send OTP',
        data: responseData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: 'Error while sending OTP',
      error: error.message,
    });
  }
};


