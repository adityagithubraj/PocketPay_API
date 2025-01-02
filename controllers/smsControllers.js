
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


//...THIS FUNCTION FOR SEND SINGUP SMS 

//http://sms.digimiles.in/bulksms/bulksms?username=DG35-triptalpay&password=digimile&type=0&dlr=1&destination=8383015513&source=TPLPAY&message=Dear KHUSHI GUPTA Sign Up Successful ID No : 69 Password : 73644 from :  VISTA Triptales&entityid=1101530690000082077&tempid=1107172897728276885

async function sendSignupSms(destination, message, tempId) {
  const username = process.env.SMS_USERNAME;   //  this is my username 
  const password = process.env.SMS_PASSWORD;  //this is my password 
  const source = process.env.SMS_SOURCE       // 'TPLPAY';
  const entityId = '1101530690000082077';     // this is my entity id 

  const url = `http://sms.digimiles.in/bulksms/bulksms?username=${username}&password=${password}&type=0&dlr=1&destination=${destination}&source=${source}&message=${encodeURIComponent(message)}&entityid=${entityId}&tempid=${tempId}`;

  try {
    const response = await axios.get(url);
    console.log('SMS sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}


// This function for Send confermation msegge for Update profile 
async function sendProfileSms(){
    const username = process.env.SMS_USERNAME;
    const password = process.env.SMS_PASSWORD;
    const source = process.env.SMS_SOURCE     // 'TPLPAY';
    const entityId = '1101530690000082077'; 
    const url = `http://sms.digimiles.in/bulksms/bulksms?username=${username}&password=${password}&type=0&dlr=1&destination=${destination}&source=${source}&message=${encodeURIComponent(message)}&entityid=${entityId}&tempid=${tempId}`;
    try {
        const response = await axios.get(url);
        console.log("Profile update SMS send successfully;",response.data);
        return response.data;  
    } catch (error) {
        console.log("Error while send SMS profile Update ", error);
        throw error;
    }
}
// Send SMS Wallet Received function 
async function sendWalletReceived(){
 const username = process.env.SMS_USERNAME;
 const password = process.env.SMS_PASSWORD; 
 const source = process.env.SMS_SOURCE;
 const entityId ='1101530690000082077';
 const url = `http://sms.digimiles.in/bulksms/bulksms?username=${username}&password=${password}&type=0&dlr=1&destination=${destination}&source=${source}&message=${encodeURIComponent(message)}&entityid=${entityId}&tempid=${tempId}`;
 
 try {
  const response  = await axios.get(url);
  console.log("Wallet Requst SMS send successfully");
  return response.data;
  
 } catch (error) {
  console.log("Error while send SMS for Wallet Received")
  throw error ;
 }
}



  module.exports = { sendSignupSms, sendProfileSms , sendWalletReceived};