
const express = require('express');
const masterController = require('../controllers/masterControllers');
// const auth  =require("../middlewares/authenticat");
const authorize = require("../middlewares/authorize");
const upload  = require("../middlewares/multerMW");
const uploadPaySlip = require("../middlewares/amountReqMW")

const masterRouter = express.Router();




masterRouter.get("/bindRole",masterController.bindRole);
masterRouter.get("/bindRegion",masterController.bindRegion);
masterRouter.get("/bindState",masterController.bindState);
masterRouter.post("/addUserRole",masterController.addUserRole);




module.exports = masterRouter;  