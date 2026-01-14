const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../controllers/authController');

router.use(authenticateToken); // Protect all chat routes

router.get('/', chatController.getChats);
router.post('/', chatController.createChat);
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', chatController.sendMessage);

module.exports = router;
