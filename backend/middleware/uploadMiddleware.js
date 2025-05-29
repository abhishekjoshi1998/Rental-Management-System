const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        let subFolder = 'general';
        if (req.baseUrl.includes('applications')) subFolder = 'applications';
        else if (req.baseUrl.includes('maintenance-requests')) subFolder = 'maintenance_photos';
        else if (req.baseUrl.includes('users') && req.path.includes('profile-picture')) subFolder = 'profile_pictures';

        const dynamicPath = path.join(uploadPath, subFolder);
        if (!fs.existsSync(dynamicPath)) {
            fs.mkdirSync(dynamicPath, { recursive: true });
        }
        cb(null, dynamicPath);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
    fileFilter: fileFilter
});

module.exports = upload;