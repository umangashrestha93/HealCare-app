const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const devUserStore = require('./utils/devUserStore');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

const initializeSocket = (server, corsOptions, app) => {
  const io = new Server(server, {
    cors: corsOptions
  });

  app.set('io', io);

  // Middleware for JWT Authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.user = decoded; // { id, role, ... }
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    socket.data.telehealthRooms = new Set();
    console.log(`Socket connected: ${socket.id} (User: ${userId})`);

    // Add to presence map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // First connection across all tabs/devices
      try {
        if (mongoose.connection.readyState === 1) {
          await User.findByIdAndUpdate(userId, { isOnline: true });
        } else {
          await devUserStore.upsertUser({ _id: userId, isOnline: true });
        }
        io.emit('user_online', userId);
      } catch (err) {
        console.error('Error marking user online:', err.message);
      }
    }
    onlineUsers.get(userId).add(socket.id);
    socket.join(userId);

    try {
      const pendingDeliveredMessages = await Message.find({
        receiverId: userId,
        delivered: false
      }).select('_id senderId');

      if (pendingDeliveredMessages.length > 0) {
        await Message.updateMany(
          { _id: { $in: pendingDeliveredMessages.map((message) => message._id) } },
          { $set: { delivered: true } }
        );

        const deliveredBySender = pendingDeliveredMessages.reduce((groups, message) => {
          const senderId = message.senderId.toString();
          if (!groups.has(senderId)) groups.set(senderId, []);
          groups.get(senderId).push(message._id);
          return groups;
        }, new Map());

        deliveredBySender.forEach((messageIds, senderId) => {
          io.to(senderId).emit('messages_delivered', messageIds);
        });
      }
    } catch (err) {
      console.error('Error marking pending messages delivered:', err.message);
    }

    // Send current online users list (only keys/userIds) to the newly connected user
    socket.emit('initialOnlineUsers', Array.from(onlineUsers.keys()));

    // Keep backwards compatibility for manually joining room (if needed)
    socket.on('joinRoom', (reqUserId) => {
      // already joined via auth logic, but we can allow explicit joins if needed
      if (reqUserId === userId) socket.join(userId);
    });

    // Typing indicators
    socket.on('typing', ({ receiverId, senderId }) => {
      io.to(receiverId.toString()).emit('typing', senderId);
    });

    socket.on('stop_typing', ({ receiverId, senderId }) => {
      io.to(receiverId.toString()).emit('stop_typing', senderId);
    });

    // Message Seen
    socket.on('message_seen', async ({ messageIds, conversationId, userId: reqUserId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { seen: true, delivered: true } }
        );

        if (conversationId) {
          const conversation = await Conversation.findById(conversationId);
          if (conversation) {
            conversation.unreadCounts.set(reqUserId.toString(), 0);
            await conversation.save();
          }
        }

        const messages = await Message.find({ _id: { $in: messageIds } });
        if (messages.length > 0) {
          const originalSenderId = messages[0].senderId.toString();
          io.to(originalSenderId).emit('messages_seen', messageIds);
        }
      } catch (err) {
        console.error('Error marking messages as seen:', err);
      }
    });

    socket.on('telehealth:join', ({ roomId }) => {
      if (!roomId) return;
      const roomName = `telehealth:${roomId}`;
      socket.join(roomName);
      socket.data.telehealthRooms.add(roomName);
      socket.to(roomName).emit('telehealth:peer-joined', {
        userId,
        socketId: socket.id
      });
    });

    socket.on('telehealth:signal', ({ roomId, signal }) => {
      if (!roomId || !signal) return;
      const roomName = `telehealth:${roomId}`;
      socket.to(roomName).emit('telehealth:signal', {
        from: socket.id,
        userId,
        signal
      });
    });

    socket.on('telehealth:leave', ({ roomId }) => {
      if (!roomId) return;
      const roomName = `telehealth:${roomId}`;
      socket.leave(roomName);
      socket.data.telehealthRooms.delete(roomName);
      socket.to(roomName).emit('telehealth:peer-left', { userId, socketId: socket.id });
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      socket.data.telehealthRooms.forEach((roomName) => {
        socket.to(roomName).emit('telehealth:peer-left', { userId, socketId: socket.id });
      });
      
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        if (userSockets.size === 0) {
          // Last tab/device closed
          onlineUsers.delete(userId);
          const lastSeenDate = new Date();
          
          try {
            if (mongoose.connection.readyState === 1) {
              await User.findByIdAndUpdate(userId, { 
                isOnline: false, 
                lastSeen: lastSeenDate 
              });
            } else {
              await devUserStore.upsertUser({ 
                _id: userId, 
                isOnline: false, 
                lastSeen: lastSeenDate 
              });
            }
            // Broadcast offline state with lastSeen timestamp
            io.emit('user_offline', { userId, lastSeen: lastSeenDate });
          } catch (error) {
            console.error('Error updating lastSeen:', error);
          }
        }
      }
    });
  });

  return io;
};

module.exports = { initializeSocket, onlineUsers };
