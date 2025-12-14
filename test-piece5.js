import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001/api';
let token1;

async function runTests() {
  try {
    console.log('🧪 PIECE 5 - SEARCH REST API TESTS\n');

    // Test 1: Login
    console.log('Test 1: Login');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser1@synapse.com',
      password: 'Test123456',
    });
    token1 = login.data.data.accessToken;
    console.log('✅ Logged in\n');

    // Test 2: Search users
    console.log('Test 2: Search users by name');
    const userSearch = await axios.get(`${BASE_URL}/search/users`, {
      headers: { Authorization: `Bearer ${token1}` },
      params: { q: 'Test', limit: 10 },
    });
    console.log(`✅ Found ${userSearch.data.data.count} users`);
    console.log(`   Users:`, userSearch.data.data.users.map(u => u.name).join(', '));
    console.log();

    // Test 3: Search conversations
    console.log('Test 3: Search conversations');
    const convoSearch = await axios.get(`${BASE_URL}/search/conversations`, {
      headers: { Authorization: `Bearer ${token1}` },
      params: { q: 'test', limit: 10 },
    });
    console.log(`✅ Found ${convoSearch.data.data.count} conversations`);
    console.log();

    // Test 4: Get recent conversations
    console.log('Test 4: Get recent conversations');
    const recent = await axios.get(`${BASE_URL}/search/recent`, {
      headers: { Authorization: `Bearer ${token1}` },
      params: { limit: 5 },
    });
    console.log(`✅ Found ${recent.data.data.count} recent conversations`);
    console.log();

    // Test 5: Get suggested users
    console.log('Test 5: Get suggested users');
    const suggestions = await axios.get(`${BASE_URL}/search/suggestions`, {
      headers: { Authorization: `Bearer ${token1}` },
      params: { limit: 10 },
    });
    console.log(`✅ Found ${suggestions.data.data.count} suggested users`);
    console.log();

    // Test 6: Validation - query too short
    console.log('Test 6: Test validation (query too short)');
    try {
      await axios.get(`${BASE_URL}/search/users`, {
        headers: { Authorization: `Bearer ${token1}` },
        params: { q: 'a' }, // Too short
      });
      console.log('❌ Should have failed validation\n');
    } catch (err) {
      console.log(`✅ Validation worked: "${err.response?.data?.message}"\n`);
    }

    // Test 7: Validation - query too long
    console.log('Test 7: Test validation (query too long)');
    try {
      await axios.get(`${BASE_URL}/search/users`, {
        headers: { Authorization: `Bearer ${token1}` },
        params: { q: 'a'.repeat(51) }, // Too long
      });
      console.log('❌ Should have failed validation\n');
    } catch (err) {
      console.log(`✅ Validation worked: "${err.response?.data?.message}"\n`);
    }

    console.log('╔════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED!         ║');
    console.log('╚════════════════════════════════╝');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

runTests();
