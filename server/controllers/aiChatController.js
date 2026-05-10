const AiConversation = require('../models/AiConversation');
const AiMessage = require('../models/AiMessage');
const {
  callOpenAi,
  summarizeConversation,
  buildFallbackReply
} = require('../services/openaiService');
const { findPractitionerRecommendations } = require('../services/practitionerRecommendationService');

const MAX_CONTEXT_MESSAGES = 16;

const getUserId = (req) => (req.user._id || req.user.id).toString();

const getOrCreateConversation = async (req, conversationId) => {
  const userId = getUserId(req);

  if (conversationId) {
    const conversation = await AiConversation.findOne({
      _id: conversationId,
      userId,
      status: 'active'
    });

    if (conversation) return conversation;
  }

  const latestConversation = await AiConversation.findOne({
    userId,
    status: 'active'
  }).sort({ lastMessageAt: -1 });

  if (latestConversation) return latestConversation;

  return AiConversation.create({
    userId,
    userRole: req.user.role,
    title: 'Healthcare assistant chat',
    lastMessageAt: new Date()
  });
};

exports.createAiConversation = async (req, res) => {
  try {
    const conversation = await AiConversation.create({
      userId: getUserId(req),
      userRole: req.user.role,
      title: 'Healthcare assistant chat',
      lastMessageAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: {
        conversation,
        messages: []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI conversation create failed', error: err.message });
  }
};

exports.getAiConversation = async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(req, req.query.conversationId);
    const messages = await AiMessage.find({
      conversationId: conversation._id,
      userId: getUserId(req)
    })
      .sort({ createdAt: 1 })
      .limit(80)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI conversation fetch failed', error: err.message });
  }
};

exports.chatWithAi = async (req, res) => {
  const io = req.app.get('io');
  const userId = getUserId(req);

  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const conversation = await getOrCreateConversation(req, conversationId);
    const content = message.trim().slice(0, 4000);

    const userMessage = await AiMessage.create({
      conversationId: conversation._id,
      userId,
      userRole: req.user.role,
      role: 'user',
      content
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    io?.to(userId).emit('ai_typing_start', { conversationId: conversation._id });

    const [recentMessages, recommendations] = await Promise.all([
      AiMessage.find({ conversationId: conversation._id, userId })
        .sort({ createdAt: -1 })
        .limit(MAX_CONTEXT_MESSAGES)
        .lean(),
      findPractitionerRecommendations(content, 3)
    ]);

    const contextMessages = recentMessages
      .reverse()
      .map((item) => ({ role: item.role, content: item.content }));

    let aiResult;
    let fallback = false;

    try {
      aiResult = await callOpenAi({
        messages: contextMessages,
        summary: conversation.summary,
        recommendations
      });
    } catch (err) {
      console.error('OpenAI chat failed:', err.message);
      fallback = true;
      aiResult = {
        content: buildFallbackReply(content, recommendations),
        model: 'local-fallback',
        responseId: '',
        usage: {}
      };
    }

    const assistantMessage = await AiMessage.create({
      conversationId: conversation._id,
      userId,
      userRole: req.user.role,
      role: 'assistant',
      content: aiResult.content,
      recommendations,
      metadata: {
        model: aiResult.model,
        responseId: aiResult.responseId,
        fallback,
        promptTokens: aiResult.usage.input_tokens,
        completionTokens: aiResult.usage.output_tokens,
        totalTokens: aiResult.usage.total_tokens
      }
    });

    conversation.lastResponseId = aiResult.responseId || conversation.lastResponseId;
    conversation.lastMessageAt = new Date();

    const totalMessages = await AiMessage.countDocuments({ conversationId: conversation._id });
    if (totalMessages > 0 && totalMessages % 12 === 0) {
      const summaryMessages = await AiMessage.find({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .limit(24)
        .lean();
      conversation.summary = await summarizeConversation({
        summary: conversation.summary,
        messages: summaryMessages.reverse()
      });
    }

    await conversation.save();

    const payload = {
      conversation,
      userMessage,
      assistantMessage
    };

    io?.to(userId).emit('ai_typing_stop', { conversationId: conversation._id });
    io?.to(userId).emit('ai_message', payload);

    res.status(200).json({
      success: true,
      data: payload
    });
  } catch (err) {
    io?.to(userId).emit('ai_typing_stop', { conversationId: req.body?.conversationId });
    res.status(500).json({ success: false, message: 'AI chat failed', error: err.message });
  }
};
