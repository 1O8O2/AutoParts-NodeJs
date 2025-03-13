const express = require('express');
const app = express();
const port = 3000;
const session = require('express-session'); // Add this

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', './views');

// Serve static files (CSS, images, etc.)
app.use(express.static('./public'));

app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(session({
  secret: 'your-secret-key',
  cookie: {
    maxAge: 1000*60*15
  }
}));

const dashboardRoute = require('./routes/client/dashboard.route');
const blogRoute = require('./routes/client/blog.route');
const accountRoute = require('./routes/client/account.route')
const {loginAuth} = require('./middlewares/loginAuth.middleware')

app.use('/AutoParts', dashboardRoute);
app.use('/AutoParts/blog', blogRoute);
app.use('/AutoParts/account', loginAuth, accountRoute);


// Sequelize database setup
const sequelize = require('./configs/database');
const Account = require('./models/Account');
const Blog = require('./models/Blog');
const BlogGroup = require('./models/BlogGroup');
const Brand = require('./models/Brand');
const { Cart, ProductsInCart } = require('./models/Cart'); 
const Customer = require('./models/Customer');
const Discount = require('./models/Discount');
const Employee = require('./models/Employee');
const Product = require('./models/Product');
const ProductGroup = require('./models/ProductGroup');
const Order = require('./models/Order');
const OrderDetail = require('./models/OrderDetail');

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




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});