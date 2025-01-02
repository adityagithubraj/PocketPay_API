const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the 'public/paymentslips' folder exists one step back from the root directory
const paymentslipsDir = path.join(__dirname, '..', 'public', ); // Go one step back, then into 'public' and 'paymentslips'
if (!fs.existsSync(paymentslipsDir)) {
  fs.mkdirSync(paymentslipsDir, { recursive: true }); // Create the directory if it doesn't exist
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentslipsDir); // Save in the 'public/paymentslips' folder one step back
  },
  filename: (req, file, cb) => {
    // Save the file with the original extension
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); 
  }
});

const uploadPaySlip = multer({ storage: storage });

// Exporting the upload middleware for routes
module.exports = uploadPaySlip;

