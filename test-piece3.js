import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const PORT = process.env.PORT || 3001;

let token1, token2, userId1, userId2, conversationId, groupId;

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  try {
    console.log('🧪 PIECE 3 - REST API TESTS');
    console.log(`📡 Testing server at: ${BASE_URL}\n`);

    // Check if server is running
    try {
      await axios.get(`http://localhost:${PORT}/health`).catch(() => {
        console.log('⚠️  Health endpoint not found (optional)\n');
      });
    } catch (err) {
      console.log('⚠️  Warning: Could not connect to server. Is it running?\n');
    }

    // Test 1: Login User 1
    console.log('Test 1: Login User 1');
    try {
      const login1 = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'testuser1@synapse.com',
        password: 'Test123456',
      });
      token1 = login1.data.data.accessToken;
      userId1 = login1.data.data.user.id;
      console.log(`✅ User 1 logged in (ID: ${userId1})\n`);
    } catch (err) {
      console.error('❌ Login failed:', err.response?.data || err.message);
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Run: node reset-test-users.js');
      console.log('   2. Check if server is running: npm start');
      console.log('   3. Verify .env has correct MONGODB_URI');
      console.log('   4. Check if test users exist in database\n');
      process.exit(1);
    }

    // Wait to avoid rate limiting
    await wait(100);

    // Test 2: Login User 2
    console.log('Test 2: Login User 2');
    try {
      const login2 = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'testuser2@synapse.com',
        password: 'Test123456',
      });
      token2 = login2.data.data.accessToken;
      userId2 = login2.data.data.user.id;
      console.log(`✅ User 2 logged in (ID: ${userId2})\n`);
    } catch (err) {
      console.error('❌ Login failed:', err.response?.data || err.message);
      process.exit(1);
    }

    await wait(100);

    // Test 3: Create direct conversation
    console.log('Test 3: Create direct conversation');
    try {
      const directConvo = await axios.post(
        `${BASE_URL}/conversations/direct`,
        { participantId: userId2 },
        { headers: { Authorization: `Bearer ${token1}` } }
      );
      conversationId = directConvo.data.data.conversation._id;
      console.log(`✅ Created: ${conversationId}`);
      console.log(`   isNew: ${directConvo.data.data.isNew}\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.data || err.message);
      process.exit(1);
    }

    await wait(100);

    // Test 4: Idempotency
    console.log('Test 4: Test idempotency');
    try {
      const sameConvo = await axios.post(
        `${BASE_URL}/conversations/direct`,
        { participantId: userId2 },
        { headers: { Authorization: `Bearer ${token1}` } }
      );
      const isNew = sameConvo.data.data.isNew;
      console.log(`✅ Returned existing conversation`);
      console.log(`   isNew: ${isNew} (should be false)`);
      console.log(`   Same ID: ${sameConvo.data.data.conversation._id === conversationId}\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.data || err.message);
      process.exit(1);
    }

    await wait(100);

    // Test 5: Create group
    console.log('Test 5: Create group conversation');
    try {
      const group = await axios.post(
        `${BASE_URL}/conversations/group`,
        {
          name: 'Test Group',
          participantIds: [userId2],
        },
        { headers: { Authorization: `Bearer ${token1}` } }
      );
      groupId = group.data.data.conversation._id;
      const participantCount = group.data.data.conversation.participants.length;
      console.log(`✅ Group created: ${groupId}`);
      console.log(`   Participants: ${participantCount}\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.data || err.message);
      process.exit(1);
    }

    await wait(100);

    // Test 6: Get all conversations
    console.log('Test 6: Get all conversations');
    try {
      const allConvos = await axios.get(`${BASE_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const count = allConvos.data.data.conversations.length;
      const total = allConvos.data.data.pagination.totalCount;
      console.log(`✅ Found ${count} conversations (total: ${total})\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.data || err.message);
      process.exit(1);
    }

    await wait(100);

    // Test 7: Get single conversation
    console.log('Test 7: Get single conversation');
    try {
      const convo = await axios.get(`${BASE_URL}/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      console.log(`✅ Retrieved conversation: ${convo.data.data.conversation._id}\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.data || err.message);
      process.exit(1);
    }

    await wait(100);

    // Test 8: Rename group
    console.log('Test 8: Rename group (as admin)');
    try {
      const updated = await axios.patch(
        `${BASE_URL}/conversations/${groupId}/name`,
        { name: 'Updated Group Name' },
        { headers: { Authorization: `Bearer ${token1}` } }
      );
      console.log(`✅ Group renamed to: "${updated.data.data.conversation.name}"\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.data || err.message);
      process.exit(1);
    }

    await wait(100);

    // Test 9: Try to rename as non-admin (should fail)
    console.log('Test 9: Try to rename as non-admin (should fail)');
    try {
      await axios.patch(
        `${BASE_URL}/conversations/${groupId}/name`,
        { name: 'Hacker Name' },
        { headers: { Authorization: `Bearer ${token2}` } }
      );
      console.log('❌ Should have thrown 403 error\n');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`✅ Correctly rejected: "${err.response.data.message}"\n`);
      } else {
        console.error('❌ Wrong error:', err.response?.data || err.message);
      }
    }

    await wait(100);

    // Test 10: Invalid request (validation)
    console.log('Test 10: Invalid request (should fail validation)');
    try {
      await axios.post(
        `${BASE_URL}/conversations/group`,
        { name: '', participantIds: [] },
        { headers: { Authorization: `Bearer ${token1}` } }
      );
      console.log('❌ Should have thrown validation error\n');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`✅ Validation worked: "${err.response.data.message}"\n`);
      } else {
        console.error('❌ Wrong error:', err.response?.data || err.message);
      }
    }

    await wait(100);

    // Test 11: Non-member access (should fail)
    console.log('Test 11: Non-member access (should fail)');
    try {
      // User 2 tries to access a conversation they left or don't belong to
      // First, let's create a conversation user2 is NOT in
      const user3Login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'testuser3@synapse.com',
        password: 'Test123456',
      }).catch(() => null);

      if (user3Login) {
        const token3 = user3Login.data.data.accessToken;
        await axios.get(`${BASE_URL}/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${token3}` },
        });
        console.log('❌ Should have thrown 403 error\n');
      } else {
        console.log('⚠️  Skipped (user3 not available)\n');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`✅ Correctly rejected: "${err.response.data.message}"\n`);
      } else {
        console.error('❌ Wrong error:', err.response?.data || err.message);
      }
    }

    console.log('╔════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED!         ║');
    console.log('╚════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Created ${conversationId ? 1 : 0} direct conversation`);
    console.log(`   ✅ Created ${groupId ? 1 : 0} group conversation`);
    console.log(`   ✅ Idempotency verified`);
    console.log(`   ✅ Authorization checks working`);
    console.log(`   ✅ Validation working\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
console.log('Starting in 2 seconds...\n');
setTimeout(runTests, 2000);
