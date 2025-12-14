import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001/api';
let token1, userId1, conversationId;

async function runTests() {
  try {
    console.log('🧪 PIECE 4 - MESSAGE REST API TESTS\n');

    // Login
    console.log('Test 1: Login');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser1@synapse.com',
      password: 'Test123456',
    });
    token1 = login.data.data.accessToken;
    userId1 = login.data.data.user.id;
    console.log('✅ Logged in\n');

    // Get conversations
    console.log('Test 2: Get conversations');
    const convos = await axios.get(`${BASE_URL}/conversations`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    conversationId = convos.data.data.conversations[0]._id;
    console.log(`✅ Found conversation: ${conversationId}\n`);

    // Get messages (should be empty initially)
    console.log('Test 3: Get messages');
    const messages = await axios.get(
      `${BASE_URL}/conversations/${conversationId}/messages`,
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    console.log(`✅ Retrieved ${messages.data.data.messages.length} messages`);
    console.log(`   Pagination:`, messages.data.data.pagination);
    console.log();

    // Get unread count
    console.log('Test 4: Get unread count');
    const unread = await axios.get(
      `${BASE_URL}/conversations/${conversationId}/messages/unread-count`,
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    console.log(`✅ Unread count: ${unread.data.data.unreadCount}\n`);

    console.log('=== ALL TESTS PASSED ===');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

runTests();
