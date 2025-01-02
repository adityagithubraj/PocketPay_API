// rechargeTransaction


const express = require('express');
const planController = require('../controllers/planControllers');
const auth = require("../middlewares/authenticat")

const planRouter = express.Router();

planRouter.post('/Mobplan',auth, planController.fetchOperatorDetails);
planRouter.post('/status',planController.fetchOperatorCode);



module.exports = planRouter;  