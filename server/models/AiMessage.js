const mongoose = require('mongoose');

const AiMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiConversation',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['client', 'practitioner', 'admin'],
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  recommendations: [{
    practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practitioner' },
    name: String,
    discipline: String,
    rating: Number,
    fee: Number,
    reasons: [String]
  }],
  metadata: {
    model: String,
    responseId: String,
    fallback: Boolean,
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  }
}, { timestamps: true });

AiMessageSchema.index({ conversationId: 1, createdAt: 1 });
AiMessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AiMessage', AiMessageSchema);
