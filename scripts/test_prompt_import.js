// Test if prompts are importing correctly
import { setterScriptPrompt } from './lib/prompts/setterScript.js';

const testData = {
  industry: 'Health & Fitness',
  idealClient: 'Busy male executives over 40',
  coreProblem: 'Burnt out with stubborn belly fat',
  outcomes: 'Lose 20-30lbs and regain all-day energy',
  uniqueAdvantage: 'Metabolic CEO Method with 20-minute micro-workouts',
  businessName: 'Executive Health Solutions',
  leadMagnetTitle: 'Metabolic CEO Guide'
};

const prompt = setterScriptPrompt(testData);

// Check if prompt contains the new structure
const hasCorrectStructure = prompt.includes('step1_openerPermission') && 
                            prompt.includes('step10_confirmShowUp') &&
                            prompt.includes('EXACTLY 10 steps');

const hasOldStructure = prompt.includes('part1') || prompt.includes('fullScript');

console.log('=== SETTER SCRIPT PROMPT TEST ===');
console.log('Has correct 10-step structure:', hasCorrectStructure);
console.log('Has old 7-part structure:', hasOldStructure);
console.log('\nFirst 500 chars of prompt:');
console.log(prompt.substring(0, 500));
console.log('\nSchema section (looking for step1_openerPermission):');
const schemaStart = prompt.indexOf('OUTPUT MUST MATCH');
if (schemaStart > -1) {
  console.log(prompt.substring(schemaStart, schemaStart + 800));
}
