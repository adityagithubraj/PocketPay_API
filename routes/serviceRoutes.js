
const express = require('express');
const serviceController = require('../controllers/serviceControllers');
const serviceRouter = express.Router();

serviceRouter.get('/getList/:serviceId?', serviceController.getServiceList);

  
module.exports = serviceRouter;  