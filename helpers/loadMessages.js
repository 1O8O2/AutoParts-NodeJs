const fs = require('fs');
const path = require('path');

// Load message codes from JSON file
const loadMessages = () => {
  try {
    const messagesPath = path.join(__dirname, '../configs/messages.json');
    const messagesData = fs.readFileSync(messagesPath, 'utf8');
    return JSON.parse(messagesData);
  } catch (error) {
    console.error('Error loading message codes:', error);
    return {};
  }
};

module.exports = loadMessages;