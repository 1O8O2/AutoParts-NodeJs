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
app.use(bodyParser.urlencoded({ extended: false} ));

// Connect to Express Flash library to show notification when changing things
const flash = require("express-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");

app.use(cookieParser("keyboard cat"));
app.use(session({ 
    cookie: { maxAge: 86400000 }, // Increase to 24 hours (1 day)
    resave: false,
    saveUninitialized: true,
    secret: "keyboard cat" 
}));
app.use(flash());

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
const sequelize = require('./configs/database');

// Sync database (optional, for development)
// sequelize.sync({ force: false }).then(() => {
//   console.log('Database synced');
//   console.log(Cart.findAll())
// }).catch(err => {
//   console.error('Error syncing database:', err);
// });

(async () => {
  try {
      await sequelize.sync({ force: false });
      console.log('Database synced');
  }
  catch (err) {
    console.error('Error', err);
}
})();

// (async () => {
//   try {
//       // Fetch product groups
//       const pgLst = await ProductGroup.findAll();
//       const parentGroups = pgLst.filter(pg => !pg.parentGroupId);
//       const groups = {};
//       parentGroups.forEach(pg => {
//           const childGroups = pgLst
//               .filter(pgr => pgr.parentGroupId && pgr.parentGroupId === pg.productGroupId && pgr.productGroupId !== pg.productGroupId)
//               .map(pgr => pgr.groupName);
//           groups[pg.groupName] = childGroups;
//       });

//       // Fetch brands và blogGroups
//       const brands = await Brand.findAll();
//       const blogGroups = await BlogGroup.findAll();

//       // Lưu vào app.locals
//       app.locals.groups = groups;
//       app.locals.brands = brands;
//       app.locals.blogGroups = blogGroups;

//       let cart = { products: ['adsadas'] }; // Default to empty array for consistency
//       if (acc) {
//         const cus = await Customer.findByPk(acc.phone);
//         if (cus) {
//           const foundCart = await Cart.findByPk(cus.cartId);
//           console.log(foundCart)
//           cart = foundCart || { products: ['dsadadasd'] }; // Fallback to empty array if null
//         }
//       }
  
//       req.session.cart = cart;
//       console.log("session:",req.session)

//       console.log('Dữ liệu toàn cục đã được tải thành công');
//   } catch (error) {
//       console.error('Lỗi khi tải dữ liệu toàn cục:', error);
//   }
// })();


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});