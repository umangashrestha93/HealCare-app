const express = require('express');
const { chatWithAi, getAiConversation, createAiConversation } = require('../controllers/aiChatController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('client'));

router.get('/conversation', getAiConversation);
router.post('/conversation', createAiConversation);
router.post('/chat', chatWithAi);

module.exports = router;
