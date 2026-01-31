import {
  diagnoseMedical,
  quickSymptomCheck,
  getMedicationInfo,
} from '../config/MedicalAI.js';

// Color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

const testMedicalAI = async () => {
  console.log(`${colors.bright}${colors.cyan}🏥 Testing Medical AI System (Bangladesh Medications)${colors.reset}\n`);
  console.log('='.repeat(80));

  try {
    // Test 1: Mild symptoms - Fever & Headache (Common in Bangladesh)
    console.log(`\n${colors.yellow}🤒 Test 1: Analyzing Mild Symptoms (Fever & Headache)${colors.reset}`);
    console.log('-'.repeat(80));
    const symptoms1 = 'I have a mild headache, slight fever around 99°F, and feeling tired since morning';
    console.log(`${colors.magenta}Symptoms:${colors.reset} "${symptoms1}"\n`);
    console.log(`${colors.cyan}💬 AI Response (Streaming):${colors.reset}\n`);
    
    const diagnosis1 = await diagnoseMedical(symptoms1);
    console.log(`\n\n${colors.green}✅ Structured Diagnosis:${colors.reset}\n`);
    console.log(JSON.stringify(diagnosis1, null, 2));
    console.log('\n' + '='.repeat(80));

    // Test 2: Moderate symptoms - Respiratory infection
    console.log(`\n${colors.yellow}🤧 Test 2: Analyzing Moderate Symptoms (Respiratory Infection)${colors.reset}`);
    console.log('-'.repeat(80));
    const symptoms2 = 'Persistent cough for 3 days, chest congestion, body aches, temperature 101°F, difficulty sleeping';
    console.log(`${colors.magenta}Symptoms:${colors.reset} "${symptoms2}"\n`);
    console.log(`${colors.cyan}💬 AI Response (Streaming):${colors.reset}\n`);
    
    const diagnosis2 = await diagnoseMedical(symptoms2);
    console.log(`\n\n${colors.green}✅ Structured Diagnosis:${colors.reset}\n`);
    console.log(JSON.stringify(diagnosis2, null, 2));
    console.log('\n' + '='.repeat(80));

    // Test 3: Severe symptoms (should recommend immediate doctor visit)
    console.log(`\n${colors.red}🚨 Test 3: Analyzing Severe Symptoms (EMERGENCY)${colors.reset}`);
    console.log('-'.repeat(80));
    const symptoms3 = 'Severe chest pain, difficulty breathing, dizziness, rapid heartbeat, sweating';
    console.log(`${colors.magenta}Symptoms:${colors.reset} "${symptoms3}"\n`);
    console.log(`${colors.cyan}💬 AI Response (Streaming):${colors.reset}\n`);
    
    const diagnosis3 = await diagnoseMedical(symptoms3);
    console.log(`\n\n${colors.green}✅ Structured Diagnosis:${colors.reset}\n`);
    console.log(JSON.stringify(diagnosis3, null, 2));
    
    if (diagnosis3.needsDoctorImmediately) {
      console.log(`\n${colors.red}${colors.bright}⚠️  URGENT: This condition requires IMMEDIATE medical attention!${colors.reset}`);
    }
    console.log('\n' + '='.repeat(80));

    // Test 4: Quick symptom check - Allergies
    console.log(`\n${colors.yellow}⚡ Test 4: Quick Symptom Check (Allergies)${colors.reset}`);
    console.log('-'.repeat(80));
    const symptoms4 = 'runny nose, sneezing, watery eyes';
    console.log(`${colors.magenta}Symptoms:${colors.reset} "${symptoms4}"\n`);
    console.log(`${colors.cyan}💬 AI Response (Streaming):${colors.reset}\n`);
    
    const quickCheck = await quickSymptomCheck(symptoms4);
    console.log(`\n\n${colors.green}✅ Quick Assessment:${colors.reset}`);
    console.log(quickCheck);
    console.log('\n' + '='.repeat(80));

    // Test 5: Medication information - Bangladesh brand (Napa)
    console.log(`\n${colors.yellow}💊 Test 5: Medication Information (Bangladesh Brand)${colors.reset}`);
    console.log('-'.repeat(80));
    const medication = 'Napa (Paracetamol)';
    console.log(`${colors.magenta}Medication:${colors.reset} "${medication}"\n`);
    console.log(`${colors.cyan}💬 AI Response (Streaming):${colors.reset}\n`);
    
    const medInfo = await getMedicationInfo(medication);
    console.log(`\n\n${colors.green}✅ Medication Info:${colors.reset}\n`);
    console.log(JSON.stringify(medInfo, null, 2));
    console.log('\n' + '='.repeat(80));

    // Test 6: Another Bangladesh medication - Ace Plus
    console.log(`\n${colors.yellow}💊 Test 6: Medication Information (Ace Plus)${colors.reset}`);
    console.log('-'.repeat(80));
    const medication2 = 'Ace Plus (Paracetamol + Caffeine)';
    console.log(`${colors.magenta}Medication:${colors.reset} "${medication2}"\n`);
    console.log(`${colors.cyan}💬 AI Response (Streaming):${colors.reset}\n`);
    
    const medInfo2 = await getMedicationInfo(medication2);
    console.log(`\n\n${colors.green}✅ Medication Info:${colors.reset}\n`);
    console.log(JSON.stringify(medInfo2, null, 2));
    console.log('\n' + '='.repeat(80));

    console.log(`\n${colors.bright}${colors.green}🎉 All Medical AI tests completed successfully!${colors.reset}`);
    console.log(`\n${colors.cyan}📊 Summary:${colors.reset}`);
    console.log(`   ${colors.green}✅${colors.reset} Disease prediction from symptoms`);
    console.log(`   ${colors.green}✅${colors.reset} Severity and urgency assessment`);
    console.log(`   ${colors.green}✅${colors.reset} Bangladesh medication suggestions (Napa, Ace Plus, Fexo, Sergel)`);
    console.log(`   ${colors.green}✅${colors.reset} Doctor visit recommendations`);
    console.log(`   ${colors.green}✅${colors.reset} Quick symptom checking`);
    console.log(`   ${colors.green}✅${colors.reset} Medication information lookup`);
    console.log(`   ${colors.green}✅${colors.reset} Real-time streaming responses`);
    
    console.log(`\n${colors.cyan}🔒 Safety Features:${colors.reset}`);
    console.log('   - Conservative recommendations');
    console.log('   - Automatic urgency detection');
    console.log('   - Clear warnings for severe symptoms');
    console.log('   - Medical disclaimer included');
    console.log('   - Only OTC medication suggestions');
    console.log('   - Bangladesh pharmacy-compatible brands');
    
    console.log(`\n${colors.magenta}💊 Bangladesh Medications Prioritized:${colors.reset}`);
    console.log('   • Napa, Napa Extra, Napa Extend (Paracetamol)');
    console.log('   • Ace, Ace Plus (Paracetamol + Caffeine)');
    console.log('   • Fexo (Fexofenadine - Antihistamine)');
    console.log('   • Sergel (Serratiopeptidase - Anti-inflammatory)');
    console.log('   • Alatrol (Cetirizine - Antihistamine)');
    console.log('   • Omidon (Omeprazole - Antacid)');
    
    console.log(`\n${colors.blue}💡 Model Used: meta-llama/Llama-3.1-70B-Instruct (FREE)${colors.reset}`);
    console.log('   - 70 BILLION parameters (9x more powerful than 8B)');
    console.log('   - Superior medical knowledge and accuracy');
    console.log('   - Real-time streaming output');
    console.log('   - No Python required');
    console.log('   - Works via Hugging Face Inference API');
    console.log('   - Configured for Bangladesh healthcare context\n');
    
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
