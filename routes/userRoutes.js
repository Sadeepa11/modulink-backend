const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../controllers/authController');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../controllers/authController');
const upload = require('../middleware/upload'); // Use Cloudinary middleware

router.get('/', authenticateToken, userController.getUsers);
router.get('/me', authenticateToken, userController.getCurrentUser);
router.put('/me', authenticateToken, upload.single('profilePic'), userController.updateProfile); // Consistent with frontend
router.delete('/me', authenticateToken, userController.deleteAccount); // Also consistent with frontend delete call

module.exports = router;
