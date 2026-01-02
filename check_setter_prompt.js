const { setterScriptPrompt } = require('./lib/prompts/setterScript.js');
const testData = { 
  industry: 'Test', 
  idealClient: 'Test Client',
  businessName: 'Test Business',
  leadMagnetTitle: 'Test Lead Magnet'
};

const prompt = setterScriptPrompt(testData);

const hasStep1 = prompt.includes('step1_openerPermission');
const hasStep10 = prompt.includes('step10_confirmShowUp');
const hasExactly10Steps = prompt.match(/step\d+_/g)?.length >= 10;
const hasPart1 = prompt.includes('"part1"') || prompt.includes('Part1');
const hasFullScript = prompt.includes('"fullScript"');

console.log('===== SETTER SCRIPT PROMPT CHECK =====');
console.log('Has step1_openerPermission:', hasStep1);
console.log('Has step10_confirmShowUp:', hasStep10);
console.log('Has 10 steps:', hasExactly10Steps);
console.log('Has part1 (OLD/WRONG):', hasPart1);
console.log('Has fullScript (OLD/WRONG):', hasFullScript);
console.log('\nVERDICT:', hasStep1 && hasStep10 && hasExactly10Steps ? '✅ CORRECT' : '❌ WRONG');

// Show a snippet of the schema section
const schemaStart = prompt.indexOf('OUTPUT MUST MATCH');
if (schemaStart > -1) {
  console.log('\nSchema snippet:');
  console.log(prompt.substring(schemaStart, schemaStart + 400));
}
