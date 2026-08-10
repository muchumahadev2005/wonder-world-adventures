const fs = require('fs');
const path = 'C:\\Users\\Mahadev\\.gemini\\antigravity-ide\\brain\\7a12d18b-2a32-45b1-9c63-46d8f69a09b1\\.system_generated\\steps\\51\\content.md';

const raw = fs.readFileSync(path, 'utf8');
const jsonStart = raw.indexOf('{');
const jsonStr = raw.slice(jsonStart);
const data = JSON.parse(jsonStr);

console.log('Total models from OpenRouter:', data.data.length);

const freeModels = data.data.filter(m => m.pricing && m.pricing.prompt === '0');
console.log('Free models count:', freeModels.length);

freeModels.slice(0, 15).forEach(m => {
  console.log(`- ${m.id} (${m.name})`);
});
