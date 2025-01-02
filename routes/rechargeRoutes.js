// rechargeTransaction


const express = require('express');
const rechargeController = require('../controllers/rechargeControllers');
const auth = require("../middlewares/authenticat")

const rechargeRouter = express.Router();

//...THIS ROUTE FOR MOBILE RECHARGE 
rechargeRouter.post('/mobile',auth, rechargeController.recharge);

//....THIS  ROUTE FOR FASTAGE RECHARGE 
rechargeRouter.post('/fastag',auth, rechargeController.recharge);


//....THIS  ROUTE FOR POSTPAIDE RECHARGE 
rechargeRouter.post('/postpaid',auth, rechargeController.recharge);


//.......THIS IS FOR DTH RECHARGE 
rechargeRouter.post('/dth',auth, rechargeController.recharge);



rechargeRouter.post("/Complain",auth,rechargeController.sendComplain);
rechargeRouter.post("/getComplainStatus",auth,rechargeController.getComplainStatus);

module.exports = rechargeRouter;  