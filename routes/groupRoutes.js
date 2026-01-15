const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../controllers/authController');

router.use(authenticateToken);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:id/messages', groupController.getGroupMessages);
router.post('/:id/messages', groupController.sendMessage);
router.get('/:id', groupController.getGroupDetails);
router.put('/:id', groupController.updateGroup);
router.put('/:id/members', groupController.updateGroupMember);

module.exports = router;
