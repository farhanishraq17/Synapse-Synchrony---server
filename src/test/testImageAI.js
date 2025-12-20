import {
  analyzeImageFromPath,
  captionImageFromPath,
} from '../config/HuggingFaceSetup.js';

const testImage = async () => {
  try {
    console.log('🖼️  Testing Image AI with Background.jpg...\n');

    // Test 1: Get image caption/description
    console.log('📝 Getting image caption...');
    const caption = await captionImageFromPath('./src/assets/Background.jpg');
    console.log('✅ Caption:', caption);
    console.log('\n---\n');

    // Test 2: Ask specific questions about the image
    console.log('❓ What is in this image?');
    const answer1 = await analyzeImageFromPath(
      'What is in this image?',
      './src/assets/Background.jpg'
    );
    console.log('✅ Answer:', answer1);
    console.log('\n---\n');

    console.log('❓ What colors are dominant?');
    const answer2 = await analyzeImageFromPath(
      'What colors are in this image?',
      './src/assets/Background.jpg'
    );
    console.log('✅ Answer:', answer2);
    console.log('\n---\n');

    console.log('❓ Is this indoors or outdoors?');
    const answer3 = await analyzeImageFromPath(
      'Is this indoors or outdoors?',
      './src/assets/Background.jpg'
    );
    console.log('✅ Answer:', answer3);

    console.log('\n✨ Image AI test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the test
testImage();
