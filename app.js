const express = require('express');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require("./routes/serviceRoutes");
const rechargeRoutes = require("./routes/rechargeRoutes");
const elBillrouter = require("./routes/elBillRoutes");
const bilPlanRouter=require("./routes/planRoutes");
const adminRouter = require("./routes/adminRoutes");
const kycRouter = require("./routes/KycRoutes");
const  masterRoutr = require("./routes/masterRoutes")
const ticketRouter  = require("./routes/ticketV2Routes")
const chakeAdminLock = require("./middlewares/forchakelockAdmin");


///////////////
const path = require('path');


const cors = require("cors");

const app = express();
require('dotenv').config();


// Apply CORS middleware
app.use(cors()); // ........allow CORS for all domains


app.use(express.json());

const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

///////////////
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Use the user routers
app.use('/user', userRoutes);
console.log("this logs for app.js");
app.use('/service', serviceRoutes);
app.use("/recharge",rechargeRoutes);
app.use("/elBill", elBillrouter);
app.use("/plan", bilPlanRouter);
app.use("/admin",chakeAdminLock,adminRouter);
app.use("/kyc",kycRouter);
app.use("/master",masterRoutr),
app.use("/ticketV2", ticketRouter)


app.get("/",(req,res)=>{
res.send("welcome to home page.........*WELLCOME TO HOME PAGE TRIPTALS PAY*")
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
