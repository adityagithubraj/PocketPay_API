// const express = require('express');
// const userController = require('../controllers/userController');
// const auth  =require("../middlewares/authenticat");
// const upload  = require("../middlewares/multerMW");
// const uploadPaySlip = require("../middlewares/amountReqMW")
// const router = express.Router();


// router.get('/getAll', userController.getAllUsers);
// router.get('/get',auth, userController.getUserById);

// router.get('/getRechLogs',auth, userController.getUserBalance);
// router.get('/getbal',auth,userController.getUserBalance2);


// router.get("/getCompBankList",userController.getBankList);
// router.get("/getBankList", userController.getUserBank);

// // router.get("/getRechLogs",auth,userController.);

// //THIS ROUTE GRT WALET REQUST FOR USER 
// router.post("/getWaletReq", auth, userController.getWaletReq);

// //..............NWE ROUTE FOR IMG 
// router.post('/updateProfile', auth, upload.single('user_img'), userController.updateProfile);


// router.post("/requstMoney" ,auth, uploadPaySlip.single("slipImage") , userController.addMoneyRequest);

// router.post("/signup", userController.signupUser);
// router.post("/login", userController.loginUser);

// // router.put('/update/:id', userController.updateUser);

// router.post("/signupV2",userController.signupUserV2);
// router.post("/UserWalletReq",userController.addMoneyRequest);

// router.post("/forgetPass",userController.forgetPass);



// module.exports = router;  



//................NEW CHANGE  IN USER  ROUTE  ......................//


const express = require('express');
const userController = require('../controllers/userController');
const auth  =require("../middlewares/authenticat");
const upload  = require("../middlewares/multerMW");
const uploadPaySlip = require("../middlewares/amountReqMW")
const router = express.Router();



router.get('/getAll',auth , userController.getAllUsers);
router.get('/get',auth, userController.getUserById);

//router.get('/getbalance',auth, userController.getUserBalance);


router.get('/getRechLogs',auth, userController.getUserBalance);
router.get('/getbal',auth,userController.getUserBalance2)


router.get("/getCompBankList",userController.getBankList);
router.get("/getBankList", userController.getUserBank);

//router.get("/getRechLogs",auth,userController.getRechargeLogs);


//THIS ROUTE GRT WALET REQUST FOR USER 
router.post("/getWaletReq", auth, userController.getWaletReq);

//..............NWE ROUTE FOR IMG 

router.post('/updateProfile', auth, upload.single('user_img'), userController.updateProfile);
router.post("/requstMoney" ,auth, uploadPaySlip.single("slipImage") , userController.addMoneyRequest);

router.post("/signup", userController.signupUser);
router.post("/login", userController.loginUser);


// router.put('/update/:id', userController.updateUser);

router.post("/signupV2",userController.signupUserV2);
router.post("/UserWalletReq",userController.addMoneyRequest);
router.post("/forgetPass",userController.forgetPass);


module.exports = router;  