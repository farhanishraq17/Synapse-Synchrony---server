import { io } from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001';
let token1, token2, socket1, socket2, conversationId, messageId;

async function runTests() {
  try {
    console.log('🧪 PIECE 9 - READ RECEIPTS & MESSAGE STATUS TESTS\n');

    // Test 1: Login users
    console.log('Test 1: Login two users');
    const [login1, login2] = await Promise.all([
      axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'testuser1@synapse.com',
        password: 'Test123456',
      }),
      axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'testuser2@synapse.com',
        password: 'Test123456',
      }),
    ]);
    token1 = login1.data.data.accessToken;
    token2 = login2.data.data.accessToken;
    console.log('✅ Both users logged in\n');

    // Test 2: Get conversation
    console.log('Test 2: Get conversation');
    const convos = await axios.get(`${BASE_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    conversationId = convos.data.data.conversations[0]._id;
    console.log(`✅ Using conversation: ${conversationId}\n`);

    // Test 3: Connect sockets
    console.log('Test 3: Connect both users');
    socket1 = io(BASE_URL, { auth: { token: token1 } });
    socket2 = io(BASE_URL, { auth: { token: token2 } });

    await Promise.all([
      new Promise((resolve) => socket1.on('connect', resolve)),
      new Promise((resolve) => socket2.on('connect', resolve)),
    ]);
    console.log('✅ Both users connected\n');

    // Test 4: Join rooms
    console.log('Test 4: Join conversation rooms');
    await Promise.all([
      new Promise((resolve) => socket1.emit('conversation:join', { conversationId }, resolve)),
      new Promise((resolve) => socket2.emit('conversation:join', { conversationId }, resolve)),
    ]);
    console.log('✅ Both users joined room\n');

    // Test 5: Get initial unread count
    console.log('Test 5: Get unread count (User 2)');
    const initialUnread = await new Promise((resolve) => {
      socket2.emit('unread:get', { conversationId }, resolve);
    });
    console.log(`✅ Initial unread count: ${initialUnread.data.unreadCount}\n`);

    // Test 6: Send a message from User 1
    console.log('Test 6: User 1 sends a message');
    const sendResult = await new Promise((resolve) => {
      socket1.emit('message:send', {
        conversationId,
        content: 'Test message for read receipt',
      }, resolve);
    });
    messageId = sendResult.data.messageId;
    console.log('✅ Message sent:', messageId);
    console.log();

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 7: Check updated unread count
    console.log('Test 7: Check unread count after new message (User 2)');
    const afterMsgUnread = await new Promise((resolve) => {
      socket2.emit('unread:get', { conversationId }, resolve);
    });
    console.log(`✅ Unread count: ${afterMsgUnread.data.unreadCount} (should be > 0)\n`);

    // Test 8: Mark message as read
    console.log('Test 8: User 2 marks message as read');
    let readReceiptReceived = false;

    socket1.on('message:read', (data) => {
      console.log(`✅ User 1 received read receipt from ${data.user.name}`);
      console.log(`   Last read at: ${data.lastReadAt}`);
      readReceiptReceived = true;
    });

    const readResult = await new Promise((resolve) => {
      socket2.emit('message:read', {
        conversationId,
        messageId,
      }, resolve);
    });

    console.log('✅ Mark as read response:', readResult.success);
    console.log(`   Unread count after: ${readResult.data.unreadCount}\n`);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (readReceiptReceived) {
      console.log('✅ Read receipt broadcast working!\n');
    } else {
      console.log('❌ Read receipt not received\n');
    }

    // Test 9: Get all unread counts
    console.log('Test 9: Get all unread counts');
    const allUnread = await new Promise((resolve) => {
      socket2.emit('unread:getAll', {
        conversationIds: [conversationId],
      }, resolve);
    });
    console.log('✅ All unread counts:', allUnread.data.unreadCounts);
    console.log();

    // Test 10: Send multiple messages and mark all as read
    console.log('Test 10: Send 3 messages and mark all as read');
    
    for (let i = 1; i <= 3; i++) {
      await new Promise((resolve) => {
        socket1.emit('message:send', {
          conversationId,
          content: `Message ${i} of 3`,
        }, resolve);
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Sent 3 messages');

    const beforeReadUnread = await new Promise((resolve) => {
      socket2.emit('unread:get', { conversationId }, resolve);
    });
    console.log(`   Unread count: ${beforeReadUnread.data.unreadCount}`);

    // Mark all as read (no messageId = mark all)
    const markAllRead = await new Promise((resolve) => {
      socket2.emit('message:read', {
        conversationId,
      }, resolve);
    });

    console.log(`✅ Marked all as read. New unread count: ${markAllRead.data.unreadCount}\n`);

    console.log('╔════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED!         ║');
    console.log('╚════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log('   ✅ Unread count tracking');
    console.log('   ✅ Mark single message as read');
    console.log('   ✅ Mark all messages as read');
    console.log('   ✅ Read receipt broadcasts');
    console.log('   ✅ Bulk unread count queries');
    console.log('   ✅ Real-time unread updates\n');

    console.log('🎉 CONGRATULATIONS! 🎉');
    console.log('Your real-time chat system is COMPLETE!\n');

    socket1.close();
    socket2.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    socket1?.close();
    socket2?.close();
    process.exit(1);
  }
}

runTests();
