const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || VISTATECH; 


const authenticateUser = (req, res, next) => {
  let token = req.headers['authorization'];
 

  if (!token) {
    return res.status(200).json({ result: false, data: '', message: 'Access denied. No token provided.', tokenValid:false });
  }

   token = token.replace('"', '');
   token=token.replace('"', '')
  console.log("this is my rex token-----", token);

  try {

     // If the token comes enclosed in quotes, remove them
   
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("MW FUNCTION decoded  token ", decoded)
    req.user = decoded;  
    next(); 
  } catch (error) {
    return res.status(200).json({ 
                                  result: false, data: '',
                                  message: 'Invalid token.', 
                                  tokenValid:false 
                                });
  }
};

module.exports = authenticateUser;
