const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateUser = (req, res, next) => {
  let token = req.headers['authorization'];
 
  if (!token) {
    return res.status(200).json({
      result: false, 
      data: '', 
      message: 'Access denied. No token provided.', 
      tokenValid: false 
    });
  }
  // Remove any surrounding quotes from the token
  token = token.replace(/"/g, '');
  console.log("Processed token: ", token);

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token ADMIN TYPE: ", decoded.admintype);

    // Check if user role is 'admin'
    // if (decoded.userRole !== 'admin') {
    //   return res.status(200).json({
    //     result: false, 
    //     data: '', 
    //     message: 'Access denied. Admins only.', 
    //     tokenValid: true 
    //   });
    // }


    //chake admintype 
    if (decoded.admintype !== 'a' && decoded.admintype !== 'sa') {
      return res.status(200).json({
        result: false, 
        data: '', 
        message: 'Access denied. Admins only.', 
        tokenValid: true 
      });
    }



    
    req.admin = decoded;  
    next(); 

  } catch (error) {
    return res.status(200).json({
      result: false, 
      data: '', 
      message: 'Invalid token.', 
      tokenValid: false 
    });
  }
};
module.exports = authenticateUser;




///...............backup code  for server 

// const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET;

// const authenticateUser = (req, res, next) => {
//   let token = req.headers['authorization'];
//   console.log("This token came from headers: ", token);

//   if (!token) {
//     return res.status(200).json({
//       result: false, 
//       data: '', 
//       message: 'Access denied. No token provided.', 
//       tokenValid: false 
//     });
//   }

//   // Remove any surrounding quotes from the token
//   token = token.replace(/"/g, '');
//   console.log("Processed token: ", token);

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, JWT_SECRET);
//     console.log("Decoded token: ", decoded);

//     // Check if user role is 'admin'
//     if (decoded.userRole !== 'admin') {
//       return res.status(200).json({
//         result: false, 
//         data: '', 
//         message: 'Access denied. Admins only.', 
//         tokenValid: true 
//       });
//     }

//     // Set user in request for further use in routes
//     req.user = decoded;  
//     next(); // Proceed to the next middleware or route handler

//   } catch (error) {
//     return res.status(200).json({
//       result: false, 
//       data: '', 
//       message: 'Invalid token.', 
//       tokenValid: false 
//     });
//   }
// };

// module.exports = authenticateUser;
