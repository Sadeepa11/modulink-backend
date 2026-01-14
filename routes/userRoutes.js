const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../controllers/authController');
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

const upload = multer({ storage: storage });

router.get('/', authenticateToken, userController.getUsers);
router.get('/me', authenticateToken, userController.getCurrentUser);
router.put('/profile', authenticateToken, upload.single('profilePic'), userController.updateProfile);
router.delete('/', authenticateToken, userController.deleteAccount);

module.exports = router;
