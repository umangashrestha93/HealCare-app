const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getConversations } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getMessages);

module.exports = router;
