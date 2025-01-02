
// const express = require('express');
// const AdminController = require('../controllers/AdminControllers');
// // const auth  =require("../middlewares/authenticat");
// const authorize = require("../middlewares/authorize");
// const chakeAdminLock = require("../middlewares/forchakelockAdmin");
// const upload  = require("../middlewares/multerMW");
// const ticket  =  require ("../middlewares/ticketAttachMW");
//  const uploadPaySlip = require("../middlewares/amountReqMW");
//  //const { uploadPaySlip, handleOptionalFileUpload } = require('../middlewares/amountReqMW');
// const { adexchangebuyer } = require('googleapis/build/src/apis/adexchangebuyer');

// const router = express.Router();



// // router.get('/getRechLogs',auth, userController.getUserBalance);
// // router.get('/getbal',auth,userController.getUserBalance2);


// // //..............NWE ROUTE FOR IMG 
// // router.post('/updateProfile', auth, upload.single('user_img'), userController.updateProfile);
// // router.post("/requstMoney" ,auth, uploadPaySlip.single("slipImage") , userController.addMoneyRequest);

// // router.post("/signup", userController.signupUser);



// //.........................
// router.post("/login",AdminController.loginAdmin);
// router.post('/getuser' ,authorize , AdminController.getUsers );
// router.get('/getAdmBal', authorize, AdminController.getAdminwaletbal);
// router.post('/getRecLogs',authorize, AdminController.getUserRecLogs);
// router.post('/getReqWalet',authorize , AdminController.gteWaletreq);
// router.post('/approveWalletReq',authorize , AdminController.approveWalletRequest);
// //router.post('/uplodeSlider',authorize, uploadPaySlip.single("slipImage") , AdminController.addSliderimge);

// router.post('/getAdmin', AdminController.getAdmin);

// //............this route for permition .....................//

// router.post('/insertAdmin', AdminController.createAdmin);
// router.post('/getAdminList', AdminController.getsubAdminList);
// router.post('/deleteAdmin',chakeAdminLock , authorize, AdminController.deleteAdmin);
// //router.post('/updateAdminFields',authorize, chakeAdminLock, AdminController.updateAdminFields);
// router.post('/updatePagePermissions', AdminController.upsertMultiplePagePermissions);
// router.post('/changeLockStatus',authorize, AdminController.changeLockStatus);
// router.post('/getPagePermissions',AdminController.getPagePermissions);

// router.post('/getslider', AdminController.getSlideimge);
// router.post('/deleteSlider',authorize, AdminController.deleteSlideimge);

// //..................TICKET ROUTER ..............................//

// router.post('/insertMessage', ticket.single('slipImage'), AdminController.insertMessage);

// router.get('/getMessages',  AdminController.getMessages);
// router.post('/updateIsRead', AdminController.updateIsRead);
// router.post('/updateIsOpen', AdminController.updateIsOpen);  //0 for open 1 for close 
// router.post('/getDashboardData',AdminController.getDashboardData);
// router.post('/insertTicketCategory', AdminController.insertTicketCategory);
// router.get('/getActiveCategories',AdminController.getActiveCategories);


// //.....................DASBOARD DATA SET.........................//
// router.post('/getDashboardData',AdminController.getDashboardData);
// router.post('/getRechargeSummary', AdminController.getRechargeSummary);
// router.post('/getRechargeDetailsSummery',AdminController.getRechargeDetailsSummery);
// router.post('/getActiveUsers', AdminController.getActiveUsers);
// router.post('/getUserSummary',AdminController.getUserSummary);
// router.post('/getTopRechargeItems',AdminController.getTopRechargeItems);
// router.post('/getKycOverview',AdminController.getKycOverview);
// router.post('/getUserKycDetails',AdminController.getUserKycDetails);




// //wallet router 
// router.post('/handleDebitCreditWallet', AdminController.handleDebitCreditWallet);

// module.exports = router;  



//.......................server code 


const express = require('express');
const AdminController = require('../controllers/AdminControllers');
// const auth  =require("../middlewares/authenticat");
const authorize = require("../middlewares/authorize");
const chakeAdminLock = require("../middlewares/forchakelockAdmin");
const ticket  =  require ("../middlewares/ticketAttachMW");
const upload  = require("../middlewares/multerMW");
const uploadPaySlip = require("../middlewares/amountReqMW")

const router = express.Router();


// router.get('/getRechLogs',auth, userController.getUserBalance);
// router.get('/getbal',auth,userController.getUserBalance2);


// //..............NWE ROUTE FOR IMG 
// router.post('/updateProfile', auth, upload.single('user_img'), userController.updateProfile);
// router.post("/requstMoney" ,auth, uploadPaySlip.single("slipImage") , userController.addMoneyRequest);

// router.post("/signup", userController.signupUser);

router.post("/login",AdminController.loginAdmin);
router.post('/getuser' ,authorize , AdminController.getUsers );
router.get('/getAdmBal', AdminController.getAdminwaletbal);
router.post('/getRecLogs',authorize, AdminController.getUserRecLogs);
router.post('/getReqWalet',authorize , AdminController.gteWaletreq);
router.post('/approveWalletReq',authorize , AdminController.approveWalletRequest);
router.post('/uplodeSlider',authorize,chakeAdminLock , uploadPaySlip.single("slipImage") , AdminController.addSliderimge);

router.post('/getAdmin', AdminController.getAdmin);

//............this route for permition .....................//

router.post('/insertAdmin', AdminController.createAdmin);
router.post('/getAdminList', AdminController.getsubAdminList);
router.post('/deleteAdmin',chakeAdminLock , authorize, AdminController.deleteAdmin);

router.post('/updateAdminFields',authorize, chakeAdminLock, AdminController.updateAdminFields);
router.post('/updatePagePermissions', AdminController.upsertMultiplePagePermissions);
router.post('/changeLockStatus',authorize, AdminController.changeLockStatus);
router.post('/getPagePermissions',AdminController.getPagePermissions);
router.post('/checkPagePermission',authorize, AdminController.checkPagePermission);  //---this route for chake page permition 


router.post('/getslider', AdminController.getSlideimge);
router.post('/deleteSlider',authorize, AdminController.deleteSlideimge);

//..................TICKET ROUTER ..............................//
router.post('/insertMessage', ticket.single('slipImage'), AdminController.insertMessage);
router.get('/getMessages',  AdminController.getMessages);
router.post('/updateIsRead', AdminController.updateIsRead);
router.post('/updateIsOpen', AdminController.updateIsOpen);  //0 for open 1 for close 

router.post('/insertTicketCategory', chakeAdminLock , AdminController.insertTicketCategory);
router.post('/getActiveCategories',AdminController.getActiveCategories);
router.post('/manageTicketCategory',AdminController.manageTicketCategory);
router.post('/toggleIsOpenField', AdminController.toggleIsOpenField);


router.post('/getDashboardData',AdminController.getDashboardData);
router.post('/getRechargeSummary', AdminController.getRechargeSummary);
router.post('/getRechargeDetailsSummery',AdminController.getRechargeDetailsSummery);
router.post('/getActiveUsers', AdminController.getActiveUsers);
router.post('/getUserSummary',AdminController.getUserSummary);
router.post('/getTopRechargeItems',AdminController.getTopRechargeItems);
router.post('/getKycOverview',AdminController.getKycOverview);
router.post('/getUserKycDetails',AdminController.getUserKycDetails);

router.post('/getRechargeLogsSummary', AdminController.getRechargeLogsSummary)


router.post('/getRechargeStatsByState', AdminController.getRechargeStatsByState);


//wallet router 
router.post('/handleDebitCreditWallet', AdminController.handleDebitCreditWallet);


// router.put('/update/:id', userController.updateUser);

// router.post("/signupV2",userController.signupUserV2);
// router.post("/UserWalletReq",userController.addMoneyRequest);


module.exports = router;  