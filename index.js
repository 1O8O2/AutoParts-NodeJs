// Connect to env
require("dotenv").config();

// Connect to ExpressJS
const express = require('express');
const app = express();
const port = 3000;

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

// Sequelize database setup
const { DatabaseSingleton } = require('./configs/database');

// Get the database instance
const dbInstance = new DatabaseSingleton().getInstance();
const sequelize = dbInstance.getSequelize();

// Test and sync the database connection
(async () => {
  try {
    // Test connection
    const isConnected = await dbInstance.testConnection();
    if (isConnected) {
      console.log('Database connection ready to use');
      
      // Sync database models
      await sequelize.sync({ force: false });
      console.log('Database models synced successfully');
    }
  } catch (err) {
    console.error('Database initialization error:', err);
  }
})();


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});