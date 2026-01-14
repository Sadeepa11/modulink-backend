const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../controllers/authController');

router.use(authenticateToken);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:id/messages', groupController.getGroupMessages);
router.post('/:id/messages', groupController.sendMessage);

module.exports = router;
