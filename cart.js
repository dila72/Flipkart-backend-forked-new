const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const Cart = mongoose.model(
  "Cart",
  new mongoose.Schema({
    userId: String,
    items: [
      {
        productId: String,
        quantity: Number,
      },
    ],
  })
);

router.post("/cart/add", async (req, res) => {
  try {
    const { productId, quantity = 1, user } = req.body;

    if (!productId || !user) {
      return res
        .status(400)
        .json({ success: false, message: "ProductId and user are required" });
    }

    let cart = await Cart.findOne({ userId: user, status: "active" });

    if (!cart) {
      cart = new Cart({ userId: user, items: [], status: "active" });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
      });
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
});

router.get("/carts", async (req, res) => {
  try {
    const carts = await Cart.find({});

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
