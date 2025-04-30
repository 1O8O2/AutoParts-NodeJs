const { el } = require('date-fns/locale');
const loadMessages = require('../helpers/loadMessages');

// Middleware to add message codes to res.locals
module.exports.loadMessageCodes = (req, res, next) => {
  // Load messages from the JSON file
  const messages = loadMessages();
  
  // Add messages to res.locals so they can be accessed in all views
  res.locals.messages = messages;
  
  next();
};