const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("./auth");
const { Product, Cart } = require("./models");

// Add item to cart (Protected route)
router.post("/cart/add", authenticateJWT, async (req, res) => {
  try {
    const { productId, quantity = 1, product } = req.body;
    const userId = req.user.userId;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: "ProductId is required" 
      });
    }

    // Check if product exists
    const productFromDB = await Product.findById(productId);
    if (!productFromDB) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Use product data from request or fetch from database
    const productData = product || {
      _id: productFromDB._id,
      name: productFromDB.name || productFromDB.title,
      title: productFromDB.title || productFromDB.name,
      thumbnail: productFromDB.thumbnail,
      price: productFromDB.price,
      brand: productFromDB.brand,
      description: productFromDB.description,
      rating: productFromDB.rating,
      discountPercentage: productFromDB.discountPercentage,
      stock: productFromDB.stock
    };

    // Find or create user's active cart
    let cart = await Cart.findOne({ userId, status: "active" });

    if (!cart) {
      cart = new Cart({ 
        userId, 
        items: [], 
        status: "active" 
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += parseInt(quantity);
      // Update product data in case it has changed
      cart.items[existingItemIndex].product = productData;
    } else {
      // Add new item to cart with complete product information
      cart.items.push({
        productId,
        product: productData,
        quantity: parseInt(quantity),
        addedAt: new Date()
      });
    }

    await cart.save();

    // Populate product details for response
    await cart.populate('items.productId');

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
});

// Get user's cart with populated product details (Protected route)
router.get("/cart", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId, status: "active" })
      .populate('items.productId', 'name price _id')
      .exec();

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          userId,
          items: [],
          totalItems: 0,
          status: 'active'
        }
      });
    }

    // Calculate total items
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      success: true,
      data: {
        ...cart.toObject(),
        totalItems
      }
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
});

// Update item quantity in cart (Protected route)
router.put("/cart/update", authenticateJWT, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.userId;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "ProductId and valid quantity are required"
      });
    }

    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    cart.items[itemIndex].quantity = parseInt(quantity);
    await cart.save();

    // Populate product details for response
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
});

// Remove item from cart (Protected route)
router.delete("/cart/remove/:productId", authenticateJWT, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate product details for response
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: cart
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
});

// Clear entire cart (Protected route)
router.delete("/cart/clear", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
});

// Get all carts (Admin only - for debugging purposes)
router.get("/carts", async (req, res) => {
  try {
    const carts = await Cart.find({})
      .populate('items.productId', 'name price _id')
      .populate('userId', 'email')
      .exec();

    res.status(200).json({
      success: true,
      count: carts.length,
      data: carts,
    });
  } catch (error) {
    console.error("Error fetching carts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart data",
      error: error.message,
    });
  }
});

module.exports = router;

// Delete route-assignment

// router.delete("/cart/:id",async(req,res)=>{
//     //check if items is there in the cart,-do the delete operation.
//     //if item is not there-err to user
// })
