const { Cart, ProductsInCart } = require("../../models/Cart");

const createCartId = async (cart, res) => {
    try {
        // Generate cart ID
        const cartId = `CART${Date.now()}${Math.random().toString(36).slice(2)}`;
        
        // Create cart with only cartId - let Sequelize handle the dates
        cart = await Cart.create({ 
            cartId
        });

        const expiresCookie = 1000 * 60 * 60 * 24 * 1; // 1 day

        res.cookie("cartId", cartId, {
            maxAge: expiresCookie,
            httpOnly: true,
            sameSite: "strict"
        });
        
        return cart;
    } catch (error) {
        console.error("Error creating cart:", error);
        return null;
    }
};

module.exports.cartId = async (req, res, next) => {
    try {
        let cart = null;
        
        if (!req.cookies.cartId) {
            // Create a cart
            cart = await createCartId(cart, res);
        } else {
            // Find existing cart
            cart = await Cart.findOne({
                where: {
                    cartId: req.cookies.cartId
                }
            });
            
            // Create new cart if not found
            if (!cart) {
                cart = await createCartId(cart, res);
            }
        }
        
        // Ensure cart has a products array even if cart creation failed
        res.locals.cart = cart || { products: [] };
    } catch (error) {
        console.error("Cart middleware error:", error);
        // Provide empty cart with products array to prevent template errors
        res.locals.cart = { products: [] };
    }
    
    next();
};