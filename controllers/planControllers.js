const axios = require("axios");

const fetchAvailablePlans = async (operatorCode, circleCode) => {
  try {
    const planFetchUrl = `https://planapi.in/api/Mobile/Operatorplan?apimember_id=5894&api_password=123456&cricle=${circleCode}&operatorcode=${operatorCode}`;
    const response = await axios.get(planFetchUrl);

    //if (response.data.STATUS !== "1") {
    //throw new Error(`Failed to fetch plans for operator: ${operatorCode}, circle: ${circleCode}`);
    //}

    return response.data;
  } catch (error) {
    throw new Error(`Error fetching available plans: ${error.message}`);
  }
};

// Controller function
exports.fetchOperatorDetails = async (req, res) => {
  const { mobileNumber } = req.body;

  try {
    const operatorFetchUrl = `https://planapi.in/api/Mobile/OperatorFetchNew?ApiUserID=5894&ApiPassword=123456&Mobileno=${mobileNumber}`;
    const response = await axios.get(operatorFetchUrl);

     //if (response.data.STATUS !== "1") {
    //return res.status(200).json({ success: false, message: `Failed to fetch operator details for number: ${mobileNumber}` });
    //}

    const operatorCode = response.data.OpCode;
    const circleCode = response.data.CircleCode;

    // Call fetchAvailablePlans after successfully fetching operator and circle code
    const plans = await fetchAvailablePlans(operatorCode, circleCode);

    return res.status(200).json({
      success: true,
      operator: response.data.Operator,
      operatorCode: operatorCode,
      circleCode: circleCode,
      plans: plans,
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: `Error fetching operator details: ${error.message}` });
  }
};



//RECHARGE STATUS CHECK function 
const fetchRechargeStatus = async (operatorCode,mobileNumber ) =>{

  console.log("MNO--",mobileNumber, "OPCODE---",operatorCode);
  try {
   // const planFetchUrl = `https://planapi.in/api/Mobile/Operatorplan?apimember_id=5894&api_password=${api_password}&cricle=${circleCode}&operatorcode=${operatorCode}`;
    const statusFetchUrl= `https://planapi.in/api/Mobile/CheckLastRecharge?Apimember_Id=5894&Api_Password=123456&Mobile_No=${mobileNumber}&Operator_Code=${operatorCode}`;
    const response = await axios.get(statusFetchUrl);

    //if (response.data.STATUS !== "1") {
    //throw new Error(`Failed to fetch plans for operator: ${operatorCode}, circle: ${circleCode}`);
    //}

    return response.data;
  } catch (error) {
    throw new Error(`Error fetching available plans: ${error.message}`);
  }

};

/////
exports.fetchOperatorCode = async (req,res)=>{
  const { mobileNumber } = req.body;
  console.log("mobileno --", mobileNumber);

  try {
    const operatorFetchUrl = `https://planapi.in/api/Mobile/OperatorFetchNew?ApiUserID=5894&ApiPassword=123456&Mobileno=${mobileNumber}`;
    const response = await axios.get(operatorFetchUrl);

 const operatorCode = response.data.OpCode;
    const circleCode = response.data.CircleCode;

    console.log("this fetched data circleCode",circleCode ,"operatorCode",operatorCode)


    const rechargeStatus = await fetchRechargeStatus(operatorCode ,mobileNumber );


    return res.status(200).json({
      success: true,
      operator: response.data,
      operatorCode: operatorCode,
      circleCode: circleCode,
      rechargeStatus: rechargeStatus,
    });

  } catch (error) {
    return res.status(200).json({ success: false, message: `Error fetching operator details: ${error.message}` });
  }
}

