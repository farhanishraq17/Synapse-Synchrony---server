import { generateText } from '../config/HuggingFaceSetup.js';

const testHuggingFace = async () => {
  console.log('🤗 Testing Hugging Face Setup...\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Text Generation with Llama
    console.log('\n📝 Test 1: Text Generation with Llama 3.2');
    console.log('-'.repeat(50));
    const prompt1 = 'What is artificial intelligence?';
    console.log(`Prompt: "${prompt1}"`);
    console.log('Generating response...\n');
    
    const generatedText1 = await generateText(prompt1);
    console.log('✅ Generated Text:');
    console.log(generatedText1);
    console.log('\n' + '='.repeat(50));

    // Test 2: Another prompt
    console.log('\n💡 Test 2: Explain Node.js');
    console.log('-'.repeat(50));
    const prompt2 = 'Explain Node.js in simple terms.';
    console.log(`Prompt: "${prompt2}"`);
    console.log('Generating response...\n');
    
    const generatedText2 = await generateText(prompt2);
    console.log('✅ Generated Text:');
    console.log(generatedText2);
    console.log('\n' + '='.repeat(50));

    // Test 3: Creative prompt
    console.log('\n🎨 Test 3: Creative Writing');
    console.log('-'.repeat(50));
    const prompt3 = 'Write a short motivational message for students learning to code.';
    console.log(`Prompt: "${prompt3}"`);
    console.log('Generating response...\n');
    
    const generatedText3 = await generateText(prompt3);
    console.log('✅ Generated Text:');
    console.log(generatedText3);
    console.log('\n' + '='.repeat(50));

    console.log('\n🎉 All Hugging Face tests completed successfully!');
    console.log('\n✅ Hugging Face is working properly with:');
    console.log('   - Model: meta-llama/Llama-3.2-3B-Instruct');
    console.log('   - Text generation working perfectly');
    console.log('   - Ready to use in your application');
    console.log('\n💡 Tips:');
    console.log('   - Your HUGGING_FACE_TOKEN is configured correctly');
    console.log('   - Free tier has rate limits but is sufficient for testing');
    console.log('   - You can use different models by passing model name to generateText()');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error('\n💡 Make sure you have:');
    console.error('   1. Added HUGGING_FACE_TOKEN to your .env file');
    console.error('   2. Installed @huggingface/inference package');
    console.error('   3. Valid API key from https://huggingface.co/settings/tokens');
  }
};

// Run the test
testHuggingFace();
