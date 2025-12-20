import {
  generateAIText,
  analyzeImageFromPath,
  captionImageFromPath,
} from '../config/GeminiSetup.js';

const testGemini = async () => {
  try {
    console.log('🧪 Testing Gemini Setup...\n');

    // Test 1: Text generation (uses 1 of your 20 daily requests)
    console.log('📝 Test 1: Text Generation');
    const text = await generateAIText('What is Node.js in one sentence?');
    console.log('✅ Response:', text);
    console.log('\n---\n');

    // Test 2: Image caption (uses 1 of your 20 daily requests)
    console.log('🖼️  Test 2: Image Caption');
    const caption = await captionImageFromPath('./src/assets/Background.jpg');
    console.log('✅ Caption:', caption);
    console.log('\n---\n');

    // Test 3: Image Q&A (uses 1 of your 20 daily requests)
    console.log('❓ Test 3: Image Question');
    const answer = await analyzeImageFromPath(
      'What are the main colors in this image?',
      './src/assets/Background.jpg'
    );
    console.log('✅ Answer:', answer);
    console.log('\n---\n');

    console.log('✨ All tests complete!');
    console.log('⚠️  You used 3 of your 20 daily Gemini requests.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testGemini();
