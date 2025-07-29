const mongoose = require("mongoose");

// User Schema
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Product Schema  
const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  description: String,
  category: String,
  brand: String,
  stock: { 
    type: Number, 
    default: 0 
  },
  thumbnail: String,
  images: [String],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      // Store complete product information for cart display
      product: {
        _id: String,
        name: String,
        title: String,
        thumbnail: String,
        price: Number,
        brand: String,
        description: String,
        rating: Number,
        discountPercentage: Number,
        stock: Number
      },
      quantity: { 
        type: Number, 
        required: true, 
        min: 1,
        default: 1 
      },
      addedAt: { 
        type: Date, 
        default: Date.now 
      }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create models
const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);

module.exports = {
  User,
  Product,
  Cart
};
