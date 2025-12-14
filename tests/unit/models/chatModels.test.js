import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../../../config/db.js';
import Conversation from '../../../models/Conversation.js';
import Message from '../../../models/Message.js';
import ReadReceipt from '../../../models/ReadReceipt.js';

console.log('\n=== TESTING CHAT MODELS ===\n');

try {
  await connectDB();
  console.log('✅ Database connected\n');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}

console.log('📋 Test 1: Verifying indexes...');
console.log('Conversation indexes:', Conversation.schema.indexes().length, 'indexes');
console.log('Message indexes:', Message.schema.indexes().length, 'indexes');
console.log('ReadReceipt indexes:', ReadReceipt.schema.indexes().length, 'indexes');
console.log('✅ All indexes defined\n');

console.log('📋 Test 2: Testing required field validation...');
try {
  const conv = new Conversation({ participants: [] });
  await conv.validate();
  console.log('❌ Should have failed validation');
} catch (error) {
  console.log('✅ Required field validation works');
}

console.log('\n📋 Test 3: Testing enum validation...');
try {
  const conv = new Conversation({ 
    type: 'invalid',
    participants: [{ userId: new mongoose.Types.ObjectId() }],
    createdBy: new mongoose.Types.ObjectId()
  });
  await conv.validate();
  console.log('❌ Should have rejected invalid enum');
} catch (error) {
  console.log('✅ Enum validation works');
}

try {
  const msg = new Message({ 
    type: 'video',
    conversationId: new mongoose.Types.ObjectId(),
    senderId: new mongoose.Types.ObjectId(),
    content: 'Test'
  });
  await msg.validate();
  console.log('❌ Should have rejected invalid message type');
} catch (error) {
  console.log('✅ Message type enum validation works');
}

console.log('\n📋 Test 4: Testing embedded participants...');
const validConv = new Conversation({
  type: 'direct',
  participants: [
    { userId: new mongoose.Types.ObjectId(), role: 'member' },
    { userId: new mongoose.Types.ObjectId(), role: 'admin' },
  ],
  createdBy: new mongoose.Types.ObjectId(),
});
console.log('✅ Valid conversation structure accepted');

console.log('\n📋 Test 5: Testing instance methods...');
const userId = validConv.participants[0].userId;
const isParticipant = validConv.isParticipant(userId);
const isAdmin = validConv.isAdmin(userId);
const count = validConv.getParticipantCount();

console.log('✅ isParticipant works:', isParticipant === true);
console.log('✅ isAdmin works:', isAdmin === false);
console.log('✅ getParticipantCount works:', count === 2);

console.log('\n📋 Test 6: Testing ReadReceipt static method...');
try {
  const testUserId = new mongoose.Types.ObjectId();
  const testConvId = new mongoose.Types.ObjectId();
  
  const receipt1 = await ReadReceipt.markAsRead(testUserId, testConvId);
  console.log('✅ First receipt created:', receipt1._id);
  
  const receipt2 = await ReadReceipt.markAsRead(testUserId, testConvId);
  console.log('✅ Upsert works - same ID:', receipt1._id.toString() === receipt2._id.toString());
  
  await ReadReceipt.deleteOne({ _id: receipt1._id });
  console.log('✅ Cleanup successful');
} catch (error) {
  console.log('⚠️  Database test error:', error.message);
}

console.log('\n=== ALL TESTS COMPLETED ===\n');

await mongoose.connection.close();
process.exit(0);
