import { HfInference } from '@huggingface/inference';
import 'dotenv/config';

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

const testBioMistral = async () => {
  console.log('🏥 Testing BioMistral - Dedicated Medical Model...\n');
  console.log('='.repeat(80));

  try {
    // Test 1: BioMistral-7B
    console.log('\n🧬 Test 1: BioMistral-7B (Medical Specialist)');
    console.log('-'.repeat(80));
    const symptoms = 'Patient presents with persistent cough for 5 days, fever 101°F, chest pain when breathing, fatigue';
    console.log(`Symptoms: "${symptoms}"\n`);
    console.log('Analyzing with BioMistral...\n');

    let fullResponse = '';
    
    const stream = hf.chatCompletionStream({
      model: 'BioMistral/BioMistral-7B', // Dedicated medical model!
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI trained on biomedical literature. Provide clinical assessment.'
        },
        {
          role: 'user',
          content: `Analyze these symptoms and provide: 1) Possible diagnoses, 2) Severity assessment, 3) Whether immediate medical attention is needed, 4) Recommended tests or examinations.\n\nSymptoms: ${symptoms}`
        }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        if (newContent) {
          fullResponse += newContent;
        }
      }
    }

    console.log('✅ BioMistral Response:');
    console.log(fullResponse);
    console.log('\n' + '='.repeat(80));

    console.log('\n🎉 BioMistral is working!');
    console.log('\n📊 BioMistral Advantages:');
    console.log('   ✅ Trained specifically on PubMed and medical literature');
    console.log('   ✅ Understands medical terminology better');
    console.log('   ✅ More accurate for clinical assessments');
    console.log('   ✅ 7B parameters - optimized for medical tasks');
    console.log('   ✅ FREE on Hugging Face');
    console.log('   ✅ No Python required');

  } catch (error) {
    console.error('\n❌ BioMistral Error:', error.message);
    
    if (error.message.includes('not available') || error.message.includes('No Inference Provider')) {
      console.error('\n⚠️  BioMistral is not available on the free inference API');
      console.error('\n💡 Available Options:');
      console.error('   1. Use Llama 3.1 70B (general but excellent medical knowledge) ✅ WORKING');
      console.error('   2. Use Mixtral-8x7B (very good for medical reasoning)');
      console.error('   3. Deploy BioMistral locally with Ollama (requires Python)');
    } else {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check HUGGING_FACE_TOKEN in .env');
      console.error('   - Ensure internet connection');
    }
  }
};

testBioMistral();
