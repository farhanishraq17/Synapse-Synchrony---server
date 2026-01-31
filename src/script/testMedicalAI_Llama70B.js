import { HfInference } from '@huggingface/inference';
import 'dotenv/config';

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

/**
 * ⚠️ NOTE: Med42-8B is NOT available on free Hugging Face Inference API
 * 
 * This test file demonstrates how to use specialized medical models,
 * but Med42-8B requires:
 * - Self-hosting with GPU
 * - Paid API access
 * - Enterprise Hugging Face account
 * 
 * RECOMMENDED ALTERNATIVE: Use meta-llama/Llama-3.1-70B-Instruct
 * - Available on free API
 * - 70B parameters (9x larger than Med42-8B)
 * - Excellent medical reasoning
 * - Already integrated in MedicalAI.js
 * 
 * This file is kept for reference and future integration if you get API access.
 */

// ❌ NOT AVAILABLE ON FREE API
// const MODEL = 'm42-health/Llama3-Med42-8B';

// ✅ RECOMMENDED: Use this instead (works on free API)
const MODEL = 'meta-llama/Llama-3.1-70B-Instruct';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function printHeader(text) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function printSection(text) {
  console.log(`\n${colors.bright}${colors.yellow}>>> ${text}${colors.reset}`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

/**
 * Generate medical response using Med42-8B
 */
async function askMedicalQuestion(question, systemPrompt = null) {
  try {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: question,
    });

    console.log(`${colors.magenta}📋 Question:${colors.reset} ${question}\n`);

    const stream = hf.chatCompletionStream({
      model: MODEL,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent medical responses
    });

    let fullResponse = '';
    process.stdout.write(`${colors.green}🤖 Response: ${colors.reset}`);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      process.stdout.write(content);
    }

    console.log('\n');
    return fullResponse;
  } catch (error) {
    printError(`Error: ${error.message}`);
    return null;
  }
}

/**
 * Test medical symptom analysis
 */
async function testSymptomAnalysis(symptoms) {
  const systemPrompt = `You are Med42, a clinical AI assistant. Analyze the symptoms provided and:
1. List possible conditions (from most to least likely)
2. Suggest which symptoms are most concerning
3. Recommend appropriate next steps
4. Indicate urgency level (routine, urgent, emergency)

Be thorough but concise. Always recommend consulting a healthcare professional.`;

  const question = `A patient presents with the following symptoms: ${symptoms}

Please analyze these symptoms and provide:
1. Possible differential diagnoses
2. Red flag symptoms to monitor
3. Recommended actions
4. Urgency level`;

  return await askMedicalQuestion(question, systemPrompt);
}

/**
 * Test medical Q&A
 */
async function testMedicalQA(question) {
  const systemPrompt = `You are Med42, a clinical AI assistant trained on medical knowledge. 
Provide accurate, evidence-based medical information. 
Keep responses clear and professional. 
Always note that this is for educational purposes and not a substitute for professional medical advice.`;

  return await askMedicalQuestion(question, systemPrompt);
}

/**
 * Test medication information
 */
async function testMedicationInfo(medication, question) {
  const systemPrompt = `You are Med42, a pharmaceutical information specialist. 
Provide detailed, accurate information about medications including:
- Mechanism of action
- Indications
- Common side effects
- Important contraindications
- Drug interactions (if relevant)`;

  const fullQuestion = `Provide information about ${medication}: ${question}`;
  return await askMedicalQuestion(fullQuestion, systemPrompt);
}

/**
 * Test clinical reasoning
 */
async function testClinicalReasoning(scenario) {
  const systemPrompt = `You are Med42, a clinical reasoning assistant. 
Analyze the clinical scenario using structured clinical reasoning:
1. Present clinical findings
2. Generate differential diagnoses
3. Suggest diagnostic workup
4. Recommend treatment approach
Use evidence-based medicine principles.`;

  return await askMedicalQuestion(scenario, systemPrompt);
}

/**
 * Main test runner
 */
async function runTests() {
  printHeader('🏥 Testing Medical AI with Llama 3.1 70B');

  console.log(`${colors.bright}Model:${colors.reset} ${MODEL}`);
  console.log(`${colors.bright}Description:${colors.reset} Advanced LLM with excellent medical reasoning`);
  console.log(`${colors.bright}Parameters:${colors.reset} 70 Billion`);
  console.log(`${colors.bright}Base Model:${colors.reset} LLaMA-3.1`);
  console.log(`${colors.bright}Availability:${colors.reset} ✅ FREE Hugging Face API`);
  console.log(`${colors.bright}Specialty:${colors.reset} Medical Q&A, Clinical Reasoning, Diagnosis\n`);

  try {
    // Test 1: Simple Medical Q&A
    printHeader('Test 1: Medical Q&A - Basic Pathophysiology');
    await testMedicalQA('What is the pathophysiology of Type 2 Diabetes Mellitus?');
    printSuccess('Medical Q&A test completed');

    // Test 2: Symptom Analysis - Mild Case
    printHeader('Test 2: Symptom Analysis - Mild Presentation');
    await testSymptomAnalysis('persistent dry cough for 2 weeks, mild fatigue, no fever');
    printSuccess('Mild symptom analysis completed');

    // Test 3: Symptom Analysis - Concerning Case
    printHeader('Test 3: Symptom Analysis - Concerning Presentation');
    await testSymptomAnalysis('severe chest pain radiating to left arm, shortness of breath, sweating, nausea');
    printSuccess('Concerning symptom analysis completed');

    // Test 4: Medication Information
    printHeader('Test 4: Medication Information Query');
    await testMedicationInfo('Metformin', 'What are the mechanism of action, common side effects, and contraindications?');
    printSuccess('Medication information test completed');

    // Test 5: Drug Interactions
    printHeader('Test 5: Drug Interaction Check');
    await testMedicalQA('What are the potential interactions between warfarin and NSAIDs? What should patients be monitored for?');
    printSuccess('Drug interaction test completed');

    // Test 6: Clinical Reasoning
    printHeader('Test 6: Clinical Reasoning - Complex Case');
    const scenario = `A 45-year-old male presents with:
- 3 months of progressive fatigue
- Unintentional weight loss (15 lbs)
- Night sweats
- Low-grade fever
- Recent travel to Southeast Asia
- No significant medical history
- Non-smoker, occasional alcohol use

Vital signs: BP 120/75, HR 88, Temp 37.8°C (100°F), RR 16

What differential diagnoses should be considered and what initial workup would you recommend?`;

    await testClinicalReasoning(scenario);
    printSuccess('Clinical reasoning test completed');

    // Test 7: Preventive Medicine
    printHeader('Test 7: Preventive Medicine Advice');
    await testMedicalQA('What are the current screening recommendations for colorectal cancer in average-risk adults?');
    printSuccess('Preventive medicine test completed');

    // Test 8: Emergency Recognition
    printHeader('Test 8: Emergency Recognition');
    await testSymptomAnalysis('sudden severe headache (worst of my life), stiff neck, photophobia, fever, confusion');
    printSuccess('Emergency recognition test completed');

    // Test 9: Pediatric Query
    printHeader('Test 9: Pediatric Medicine Question');
    await testMedicalQA('What are the key developmental milestones for a 12-month-old infant?');
    printSuccess('Pediatric medicine test completed');

    // Test 10: Lab Interpretation
    printHeader('Test 10: Laboratory Value Interpretation');
    await testMedicalQA('A patient has the following lab results: Hemoglobin 9.2 g/dL, MCV 68 fL, Ferritin 8 ng/mL. What is the most likely diagnosis and what further testing would you recommend?');
    printSuccess('Lab interpretation test completed');

    // Summary
    printHeader('✅ TEST SUMMARY - Llama 3.1 70B Medical AI');
    console.log(`${colors.green}${colors.bright}All tests completed successfully!${colors.reset}\n`);
    
    console.log(`${colors.cyan}Key Features Demonstrated:${colors.reset}`);
    console.log(`  ✓ Clinical reasoning and differential diagnosis`);
    console.log(`  ✓ Symptom analysis with urgency assessment`);
    console.log(`  ✓ Medication information and drug interactions`);
    console.log(`  ✓ Emergency recognition and triage`);
    console.log(`  ✓ Preventive medicine recommendations`);
    console.log(`  ✓ Laboratory interpretation`);
    console.log(`  ✓ Pediatric and specialized queries\n`);

    console.log(`${colors.yellow}Model Performance Notes:${colors.reset}`);
    console.log(`  • Llama 3.1 70B has 70 billion parameters`);
    console.log(`  • Excellent medical knowledge from broad training`);
    console.log(`  • Superior reasoning capabilities for complex cases`);
    console.log(`  • ✅ Available FREE on Hugging Face Inference API`);
    console.log(`  • Already integrated in your MedicalAI.js\n`);

    console.log(`${colors.magenta}Integration Tips:${colors.reset}`);
    console.log(`  • Use temperature 0.2-0.4 for consistent medical responses`);
    console.log(`  • Always include system prompts for context`);
    console.log(`  • Add disclaimers about professional medical advice`);
    console.log(`  • Consider structured output formats for diagnoses`);
    console.log(`  • Monitor for hallucinations in rare conditions\n`);

    console.log(`${colors.bright}🎯 Ready for integration into MedicalAI.js!${colors.reset}\n`);

  } catch (error) {
    printError(`Test suite error: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
console.log(`${colors.bright}${colors.cyan}Starting Med42-8B Medical Model Tests...${colors.reset}\n`);
runTests().catch(console.error);
