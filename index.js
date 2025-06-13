// Connect to env
require("dotenv").config();

// Connect to ExpressJS
const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Library to handle Date-Time
const moment = require("moment");
app.locals.moment = moment;

// Connect to use Method-override library. Because form element only have method POST, using this library to use method like DELETE, etc.
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

// Connect to parse the body when data is sent onto server by using body-parser library
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true })); // Middleware để parse form
app.use(express.json());

// Initialize session using the SessionManager singleton
const sessionManager = require('./services/SessionManager');
sessionManager.initialize(app);
sessionManager.setCookieMaxAge(3600000*24); // Set cookie max age to 24 hours
// // Connect to use flash message
// const flash = require("express-flash");
// app.use(flash());

// Set Pug as the view engine
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

const path = require('path');
// Assuming your main server file is in the root directory
const configDir = path.join(__dirname, 'configs');
// Serve static files from the 'configs' directory at the /configs URL
app.use('/configs', express.static(configDir));

// Configuration public file
app.use(express.static(`${__dirname}/public`));

// Load message codes middleware
const messagesMiddleware = require('./middlewares/messages.middleware');
app.use(messagesMiddleware.loadMessageCodes);

// App locals variables
const systemConfig = require("./configs/system");
app.locals.prefixAdmin = systemConfig.prefixAdmin;

// Socket.IO configuration
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Listen for chat messages
  socket.on('send_message', async (data) => {
    // Broadcast message to the room
    io.to(data.chatRoomId).emit('receive_message', data);
  });
  // Listen for admin joining all customer rooms
  socket.on('join_admin_rooms', async () => {
    try {
      const Chat = require('./models/Chat');
      const uniqueChats = await Chat.findAll({
        attributes: ['userEmail'],
        where: {
          deleted: false,
          senderType: 'customer'
        },
        group: ['userEmail'],
        raw: true
      });

      console.log(`Admin ${socket.id} joining ${uniqueChats.length} customer rooms`);

      // Join all customer chat rooms
      uniqueChats.forEach(chat => {
        const roomId = `chat_${chat.userEmail}`;
        socket.join(roomId);
        console.log(`Admin ${socket.id} joined room: ${roomId}`);
      });
      
      // Emit confirmation back to admin
      socket.emit('admin_rooms_joined', { roomCount: uniqueChats.length });
    } catch (error) {
      console.error('Error joining admin rooms:', error);
      socket.emit('admin_rooms_joined', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available throughout the app
app.set('socketio', io);

// Connect to routes
const route = require('./routes/client/index.route')
const routeAdmin = require('./routes/admin/index.route')
route(app);
routeAdmin(app);

// If error, show 404 page
// app.get("*", (req, res) => {
//   res.render("client/pages/error/404", {
//       pageTitle: "404 Not Found"
//   })
// });

// Get the database instance
const dbInstance = require('./configs/database');

// Test and sync the database connection
(async () => {
  try {
    // Use the improved sync handler with proper error handling
    const syncSuccess = await dbInstance.syncDatabase({ 
      force: false,  // Don't drop tables
      alter: false   // Don't automatically alter tables (safer for production)
    });
    
    if (syncSuccess) {
      console.log('Database initialization completed successfully');
    } else {
      console.warn('Database synchronization failed, but server will continue running');
    }
  } catch (err) {
    console.error('Critical database initialization error:', err);
    // In production, you might want to exit the process if database fails
    // process.exit(1);
  }
})();


server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});