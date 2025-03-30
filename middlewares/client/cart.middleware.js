const { Cart, ProductsInCart } = require("../../models/Cart");

const createCartId = async (cart, res) => {
    const cartId = `CART${Date.now()}${Math.random().toString(36).slice(2)}`;
    cart = await Cart.create({ cartId });

    const expiresCookie = 1000 * 60 * 60 * 24 * 1;

    res.cookie("cartId", cartId, {
        maxAge: expiresCookie, // Thời gian sống của cookie (milliseconds)
        httpOnly: true, // Tăng bảo mật: không cho JavaScript truy cập cookie
        sameSite: "strict" // Ngăn CSRF
    });
};

module.exports.cartId = async (req, res, next) => {
    let cart = "";
    if (!req.cookies.cartId) {
        // Create a cart
        createCartId(cart, res);
    }
    else {
        // Just take out cart
        cart = await Cart.findOne({
            where: {
                cartId: req.cookies.cartId
            }
        });
        // console.log(cart)
        if (!cart) {
            createCartId(cart, res);
        }
    }
    res.locals.cart = cart;
    
    next();
}