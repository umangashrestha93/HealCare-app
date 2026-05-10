const mongoose = require('mongoose');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

async function test() {
  await mongoose.connect('mongodb+srv://umangashrestha:P9v50Nty3s0P4r3O@beyond5.l0umd6x.mongodb.net/beyond5');
  
  const users = await User.find().limit(2);
  if (users.length < 2) return console.log('Need 2 users to test');
  
  const userA = users[0]._id;
  const userB = users[1]._id;
  
  let conv = await Conversation.create({
    participants: [userA, userB],
    unreadCounts: { [userA.toString()]: 0, [userB.toString()]: 1 }
  });
  
  const msg = await Message.create({
    conversationId: conv._id,
    senderId: userA,
    receiverId: userB,
    content: "Testing advanced architecture"
  });
  
  conv.lastMessage = msg._id;
  await conv.save();
  
  console.log("Conversation created:", conv);
  console.log("Message created:", msg);
  process.exit(0);
}
test();
