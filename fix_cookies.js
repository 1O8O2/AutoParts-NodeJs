const fs = require('fs');

const filePath = 'tests/functional/customer.profile.functional.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of array-style cookie setting with string-style
content = content.replace(/\.set\('Cookie', \['tokenUser=([^']+)'\]\)/g, ".set('Cookie', 'tokenUser=$1')");

fs.writeFileSync(filePath, content);
console.log('Fixed cookie settings in test file');
