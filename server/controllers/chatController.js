const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Practitioner = require('../models/Practitioner');

// Helper to check if users can chat
const canUsersChat = async (userAId, userBId) => {
  // We need to check if there's a booking where one is Client and the other is Practitioner
  const practA = await Practitioner.findOne({ userId: userAId });
  const practB = await Practitioner.findOne({ userId: userBId });

  const query = {
    $or: []
  };

  if (practA) {
    query.$or.push({ clientId: userBId, practitionerId: practA._id });
  }
  if (practB) {
    query.$or.push({ clientId: userAId, practitionerId: practB._id });
  }

  if (query.$or.length === 0) return false;

  const booking = await Booking.findOne(query);
  return !!booking;
};

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, attachments } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot message yourself" });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    // If no conversation exists, enforce booking rule
    if (!conversation) {
      const isAllowed = await canUsersChat(senderId, receiverId);
      if (!isAllowed) {
        return res.status(403).json({ 
          success: false, 
          message: "You can only message users after a booking has been made." 
        });
      }

      // Create conversation
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        unreadCounts: {
          [senderId.toString()]: 0,
          [receiverId.toString()]: 0
        }
      });
    }

    // Create the message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      content,
      attachments: attachments || []
    });

    // Update conversation
    conversation.lastMessage = message._id;
    // Increment unread count for receiver
    const currentUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
    conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);
    await conversation.save();

    // Populate sender details for the real-time event
    const populatedMessage = await message.populate('senderId', 'firstName lastName avatar');

    // Emit event to receiver's room
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('receiveMessage', populatedMessage);
      
      // Global notification toast event
      io.to(receiverId.toString()).emit('new_notification', {
        type: 'new_message',
        title: `New message from ${req.user.firstName}`,
        body: content,
        relatedId: message._id
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/:userId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    });

    if (!conversation) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Reset unread count for current user
    conversation.unreadCounts.set(currentUserId.toString(), 0);
    await conversation.save();

    // Mark all unread messages from other user as seen
    await Message.updateMany(
      { conversationId: conversation._id, senderId: otherUserId, seen: false },
      { $set: { seen: true, delivered: true } }
    );

    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
    .populate('participants', 'firstName lastName role avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Format the response for the frontend (like WhatsApp Recent Chats)
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(p => p._id.toString() !== currentUserId.toString());
      return {
        _id: conv._id,
        user: otherUser,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCounts.get(currentUserId.toString()) || 0,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
