const multer = require('multer');
const path = require('path');
const fs = require('fs');

const aadhaarDir = path.join(__dirname, '..', 'public'); 
if (!fs.existsSync(aadhaarDir)) {
  fs.mkdirSync(aadhaarDir, { recursive: true }); 
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, aadhaarDir); 
  },
  filename: (req, file, cb) => {
  
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); 
  }
});

const uploadAadhaar = multer({ storage: storage }).fields([
  { name: 'aadharfront', maxCount: 1 }, 
  { name: 'aadharback', maxCount: 1 }, 
]);

module.exports = uploadAadhaar;
