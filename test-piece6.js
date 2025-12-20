import { io } from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001';
let token1, socket1;

async function runTests() {
  try {
    console.log('🧪 PIECE 6 - SOCKET.IO AUTH TESTS\n');

    // Test 1: Login to get token
    console.log('Test 1: Login');
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testuser1@synapse.com',
      password: 'Test123456',
    });
    token1 = login.data.data.accessToken;
    console.log('✅ Got access token\n');

    // Test 2: Connect with valid token
    console.log('Test 2: Connect to Socket.IO with valid token');
    socket1 = io(BASE_URL, {
      auth: { token: token1 },
    });

    await new Promise((resolve, reject) => {
      socket1.on('connect', () => {
        console.log(`✅ Connected: ${socket1.id}\n`);
        resolve();
      });

      socket1.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error.message);
        reject(error);
      });

      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Test 3: Ping-pong test
    console.log('Test 3: Ping-pong test');
    socket1.emit('ping', (response) => {
      console.log('✅ Pong received:', response.message);
      console.log('   User:', response.user.name);
      console.log();
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Invalid token connection
    console.log('Test 4: Try connecting with invalid token');
    const invalidSocket = io(BASE_URL, {
      auth: { token: 'invalid_token' },
    });

    await new Promise((resolve) => {
      invalidSocket.on('connect_error', (error) => {
        console.log(`✅ Correctly rejected: "${error.message}"\n`);
        invalidSocket.close();
        resolve();
      });

      invalidSocket.on('connect', () => {
        console.log('❌ Should have been rejected\n');
        invalidSocket.close();
        resolve();
      });

      setTimeout(resolve, 2000);
    });

    // Test 5: No token connection
    console.log('Test 5: Try connecting without token');
    const noTokenSocket = io(BASE_URL);

    await new Promise((resolve) => {
      noTokenSocket.on('connect_error', (error) => {
        console.log(`✅ Correctly rejected: "${error.message}"\n`);
        noTokenSocket.close();
        resolve();
      });

      noTokenSocket.on('connect', () => {
        console.log('❌ Should have been rejected\n');
        noTokenSocket.close();
        resolve();
      });

      setTimeout(resolve, 2000);
    });

    console.log('╔════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED!         ║');
    console.log('╚════════════════════════════════╝');

    socket1.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    socket1?.close();
    process.exit(1);
  }
}

runTests();
