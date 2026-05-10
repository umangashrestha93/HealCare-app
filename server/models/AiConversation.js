const mongoose = require('mongoose');

const AiConversationSchema = new mongoose.Schema({
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
  title: {
    type: String,
    default: 'Healthcare assistant chat'
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true
  },
  summary: {
    type: String,
    default: ''
  },
  lastResponseId: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

AiConversationSchema.index({ userId: 1, status: 1, lastMessageAt: -1 });

module.exports = mongoose.model('AiConversation', AiConversationSchema);
