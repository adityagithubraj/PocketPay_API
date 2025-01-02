const express = require('express');
const ticketV2Controller = require('../controllers/ticketV2Controllers');
// const auth  =require("../middlewares/authenticat");
const authorize = require("../middlewares/authorize");
const chakeAdminLock = require("../middlewares/forchakelockAdmin");
const ticket  =  require ("../middlewares/ticketAttachMW");
const upload  = require("../middlewares/multerMW");
const uploadPaySlip = require("../middlewares/amountReqMW")

const ticketRouter = express.Router();

ticketRouter.get("/getTicketList",ticketV2Controller.getTicketList);
ticketRouter.post("/postTicket", uploadPaySlip.single("slipImage"), ticketV2Controller.postTicket)

//router.post('/uplodeSlider',authorize,chakeAdminLock , uploadPaySlip.single("slipImage") , AdminController.addSliderimge);

module.exports = ticketRouter;  