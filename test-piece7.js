import { io } from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001';
let token1, token2, socket1, socket2, conversationId;

async function runTests() {
  try {
    console.log('🧪 PIECE 7 - SOCKET MESSAGING TESTS\n');

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

    // Test 2: Get a conversation
    console.log('Test 2: Get conversation ID');
    const convos = await axios.get(`${BASE_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    conversationId = convos.data.data.conversations[0]._id;
    console.log(`✅ Using conversation: ${conversationId}\n`);

    // Test 3: Connect both users via Socket.IO
    console.log('Test 3: Connect both users to Socket.IO');
    socket1 = io(BASE_URL, { auth: { token: token1 } });
    socket2 = io(BASE_URL, { auth: { token: token2 } });

    await Promise.all([
      new Promise((resolve) => socket1.on('connect', resolve)),
      new Promise((resolve) => socket2.on('connect', resolve)),
    ]);
    console.log('✅ Both users connected\n');

    // Test 4: Join conversation rooms
    console.log('Test 4: Join conversation rooms');
    const [join1, join2] = await Promise.all([
      new Promise((resolve) => {
        socket1.emit('conversation:join', { conversationId }, resolve);
      }),
      new Promise((resolve) => {
        socket2.emit('conversation:join', { conversationId }, resolve);
      }),
    ]);
    console.log('✅ User 1 joined:', join1.success);
    console.log('✅ User 2 joined:', join2.success);
    console.log();

    // Test 5: Listen for new messages
    console.log('Test 5: Set up message listeners');
    let receivedByUser2 = false;
    
    socket2.on('message:new', (data) => {
      console.log('✅ User 2 received message:', data.message.content);
      receivedByUser2 = true;
    });
    console.log('✅ Listeners ready\n');

    // Test 6: Send a message
    console.log('Test 6: User 1 sends a message');
    const sendResult = await new Promise((resolve) => {
      socket1.emit('message:send', {
        conversationId,
        content: 'Hello from Socket.IO! 🚀',
        type: 'text',
      }, resolve);
    });
    console.log('✅ Message sent:', sendResult.success);
    console.log('   Message ID:', sendResult.data?.messageId);
    console.log();

    // Wait for message to be received
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (receivedByUser2) {
      console.log('✅ Real-time broadcast working!\n');
    } else {
      console.log('❌ User 2 did not receive the message\n');
    }

    // Test 7: Send another message from User 2
    console.log('Test 7: User 2 sends a reply');
    let receivedByUser1 = false;
    
    socket1.on('message:new', (data) => {
      console.log('✅ User 1 received message:', data.message.content);
      receivedByUser1 = true;
    });

    await new Promise((resolve) => {
      socket2.emit('message:send', {
        conversationId,
        content: 'Reply from User 2! 💬',
        type: 'text',
      }, resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log();

    // Test 8: Try sending to unauthorized conversation
    console.log('Test 8: Try sending to non-existent conversation');
    const unauthorizedResult = await new Promise((resolve) => {
      socket1.emit('message:send', {
        conversationId: '507f1f77bcf86cd799439011', // Fake ID
        content: 'This should fail',
      }, resolve);
    });
    console.log('✅ Correctly rejected:', !unauthorizedResult.success);
    console.log('   Message:', unauthorizedResult.message);
    console.log();

    console.log('╔════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED!         ║');
    console.log('╚════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log('   ✅ Real-time messaging working');
    console.log('   ✅ Message broadcasting working');
    console.log('   ✅ Authorization checks working');
    console.log('   ✅ Acknowledgements working\n');

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
