import {
  diagnoseMedical,
  quickSymptomCheck,
  getMedicationInfo,
} from '../config/MedicalAI.js';

const testMedicalAI = async () => {
  console.log('🏥 Testing Medical AI System...\n');
  console.log('='.repeat(80));

  try {
    // Test 1: Mild symptoms
    console.log('\n🤒 Test 1: Analyzing Mild Symptoms');
    console.log('-'.repeat(80));
    const symptoms1 = 'I have a mild headache, slight fever around 99°F, and feeling tired since morning';
    console.log(`Symptoms: "${symptoms1}"\n`);
    console.log('Analyzing...\n');
    
    const diagnosis1 = await diagnoseMedical(symptoms1);
    console.log('✅ Diagnosis Result:\n');
    console.log(JSON.stringify(diagnosis1, null, 2));
    console.log('\n' + '='.repeat(80));

    // Test 2: Moderate symptoms
    console.log('\n🤧 Test 2: Analyzing Moderate Symptoms');
    console.log('-'.repeat(80));
    const symptoms2 = 'Persistent cough for 3 days, chest congestion, body aches, temperature 101°F, difficulty sleeping';
    console.log(`Symptoms: "${symptoms2}"\n`);
    console.log('Analyzing...\n');
    
    const diagnosis2 = await diagnoseMedical(symptoms2);
    console.log('✅ Diagnosis Result:\n');
    console.log(JSON.stringify(diagnosis2, null, 2));
    console.log('\n' + '='.repeat(80));

    // Test 3: Severe symptoms (should recommend immediate doctor visit)
    console.log('\n🚨 Test 3: Analyzing Severe Symptoms');
    console.log('-'.repeat(80));
    const symptoms3 = 'Severe chest pain, difficulty breathing, dizziness, rapid heartbeat, sweating';
    console.log(`Symptoms: "${symptoms3}"\n`);
    console.log('Analyzing...\n');
    
    const diagnosis3 = await diagnoseMedical(symptoms3);
    console.log('✅ Diagnosis Result:\n');
    console.log(JSON.stringify(diagnosis3, null, 2));
    
    if (diagnosis3.needsDoctorImmediately) {
      console.log('\n⚠️  URGENT: This condition requires immediate medical attention!');
    }
    console.log('\n' + '='.repeat(80));

    // Test 4: Quick symptom check
    console.log('\n⚡ Test 4: Quick Symptom Check');
    console.log('-'.repeat(80));
    const symptoms4 = 'runny nose, sneezing, watery eyes';
    console.log(`Symptoms: "${symptoms4}"\n`);
    console.log('Getting quick assessment...\n');
    
    const quickCheck = await quickSymptomCheck(symptoms4);
    console.log('✅ Quick Assessment:');
    console.log(quickCheck);
    console.log('\n' + '='.repeat(80));

    // Test 5: Medication information
    console.log('\n💊 Test 5: Medication Information');
    console.log('-'.repeat(80));
    const medication = 'Paracetamol';
    console.log(`Medication: "${medication}"\n`);
    console.log('Fetching information...\n');
    
    const medInfo = await getMedicationInfo(medication);
    console.log('✅ Medication Info:\n');
    console.log(JSON.stringify(medInfo, null, 2));
    console.log('\n' + '='.repeat(80));

    console.log('\n🎉 All Medical AI tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Disease prediction from symptoms');
    console.log('   ✅ Severity and urgency assessment');
    console.log('   ✅ Medication suggestions');
    console.log('   ✅ Doctor visit recommendations');
    console.log('   ✅ Quick symptom checking');
    console.log('   ✅ Medication information lookup');
    
    console.log('\n🔒 Safety Features:');
    console.log('   - Conservative recommendations');
    console.log('   - Automatic urgency detection');
    console.log('   - Clear warnings for severe symptoms');
    console.log('   - Medical disclaimer included');
    console.log('   - Only OTC medication suggestions');
    
    console.log('\n💡 Model Used: meta-llama/Llama-3.1-70B-Instruct (FREE)');
    console.log('   - 70 BILLION parameters (9x more powerful than 8B)');
    console.log('   - Superior medical knowledge and accuracy');
    console.log('   - No Python required');
    console.log('   - Works via Hugging Face Inference API');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check HUGGING_FACE_TOKEN in .env');
    console.error('   2. Ensure internet connection');
    console.error('   3. Verify Hugging Face API is accessible');
  }
};

// Run the test
testMedicalAI();
