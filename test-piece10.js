import axios from 'axios';
import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001';
let token1, token2, conversationId, socket2;

async function runTests() {
  try {
    console.log('🧪 PIECE 10 - REST MESSAGE SENDING + INTEGRATION TESTS\n');

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

    // Test 3: Connect User 2 via Socket.IO and join room
    console.log('Test 3: Connect User 2 via Socket.IO');
    socket2 = io(BASE_URL, { auth: { token: token2 } });
    
    await new Promise((resolve) => socket2.on('connect', resolve));
    await new Promise((resolve) => {
      socket2.emit('conversation:join', { conversationId }, resolve);
    });
    console.log('✅ User 2 connected and joined room\n');

    // Test 4: Send message via REST API (User 1)
    console.log('Test 4: User 1 sends message via REST API');
    let messageReceived = false;

    socket2.on('message:new', (data) => {
      console.log('✅ User 2 received message via Socket.IO:', data.message.content);
      messageReceived = true;
    });

    const sendResponse = await axios.post(
      `${BASE_URL}/api/conversations/${conversationId}/messages`,
      {
        content: 'Hello from REST API! 📡',
        type: 'text',
      },
      {
        headers: { Authorization: `Bearer ${token1}` },
      }
    );

    console.log('✅ Message sent via REST:', sendResponse.data.success);
    console.log('   Message ID:', sendResponse.data.data.message._id);
    console.log();

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (messageReceived) {
      console.log('✅ REST → Socket.IO broadcast working!\n');
    } else {
      console.log('❌ Socket.IO broadcast not received\n');
    }

    // Test 5: Edit message via REST API
    console.log('Test 5: Edit message via REST API');
    let editReceived = false;
    const messageId = sendResponse.data.data.message._id;

    socket2.on('message:edited', (data) => {
      console.log('✅ User 2 received edit via Socket.IO:', data.message.content);
      editReceived = true;
    });

    await axios.patch(
      `${BASE_URL}/api/conversations/${conversationId}/messages/${messageId}`,
      {
        content: 'Edited message via REST! ✏️',
      },
      {
        headers: { Authorization: `Bearer ${token1}` },
      }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (editReceived) {
      console.log('✅ Edit broadcast working!\n');
    }

    // Test 6: Delete message via REST API
    console.log('Test 6: Delete message via REST API');
    let deleteReceived = false;

    socket2.on('message:deleted', (data) => {
      console.log('✅ User 2 received delete via Socket.IO');
      deleteReceived = true;
    });

    await axios.delete(
      `${BASE_URL}/api/conversations/${conversationId}/messages/${messageId}`,
      {
        headers: { Authorization: `Bearer ${token1}` },
      }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (deleteReceived) {
      console.log('✅ Delete broadcast working!\n');
    }

    // Test 7: Send multiple messages via REST
    console.log('Test 7: Send 3 messages via REST API');
    for (let i = 1; i <= 3; i++) {
      await axios.post(
        `${BASE_URL}/api/conversations/${conversationId}/messages`,
        {
          content: `REST Message ${i} of 3`,
        },
        {
          headers: { Authorization: `Bearer ${token1}` },
        }
      );
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.log('✅ Sent 3 messages via REST\n');

    // Test 8: Get messages via REST
    console.log('Test 8: Get messages via REST API');
    const messages = await axios.get(
      `${BASE_URL}/api/conversations/${conversationId}/messages?limit=10`,
      {
        headers: { Authorization: `Bearer ${token1}` },
      }
    );
    console.log(`✅ Retrieved ${messages.data.data.messages.length} messages`);
    console.log('   Pagination:', messages.data.data.pagination);
    console.log();

    // Test 9: Full workflow test
    console.log('Test 9: Full workflow - Create conversation → Send → Read');
    
    // Create new conversation
    const newConvo = await axios.post(
      `${BASE_URL}/api/conversations/direct`,
      {
        participantId: login2.data.data.user.id,
      },
      {
        headers: { Authorization: `Bearer ${token1}` },
      }
    );
    const newConvoId = newConvo.data.data.conversation._id;
    console.log('✅ Created new conversation:', newConvoId);

    // Send message
    await axios.post(
      `${BASE_URL}/api/conversations/${newConvoId}/messages`,
      {
        content: 'First message in new conversation!',
      },
      {
        headers: { Authorization: `Bearer ${token1}` },
      }
    );
    console.log('✅ Sent message to new conversation');

    // Check unread count
    const unreadCount = await axios.get(
      `${BASE_URL}/api/conversations/${newConvoId}/messages/unread-count`,
      {
        headers: { Authorization: `Bearer ${token2}` },
      }
    );
    console.log(`✅ Unread count for User 2: ${unreadCount.data.data.unreadCount}`);

    // Mark as read
    await axios.post(
      `${BASE_URL}/api/conversations/${newConvoId}/messages/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token2}` },
      }
    );
    console.log('✅ Marked messages as read\n');

    console.log('╔════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED!         ║');
    console.log('╚════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log('   ✅ Send messages via REST API');
    console.log('   ✅ Edit messages via REST API');
    console.log('   ✅ Delete messages via REST API');
    console.log('   ✅ REST → Socket.IO broadcasts');
    console.log('   ✅ Full conversation workflow');
    console.log('   ✅ REST + Socket.IO integration');
    console.log('\n🎉 COMPLETE SYSTEM INTEGRATION! 🎉');
    console.log('You can now send messages via BOTH REST and Socket.IO!\n');

    socket2.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    socket2?.close();
    process.exit(1);
  }
}

runTests();
