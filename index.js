const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Import and use auth and cart routes
const { router: authRoutes, authenticateJWT } = require("./auth");
const cartRoutes = require("./cart");
app.use(authRoutes);
app.use(cartRoutes);

mongoose.connect(
  "mongodb+srv://admin:ygKfZmucQpNhOHMc@cluster0.zvfytaf.mongodb.net/ecommerce",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const productSchema = new mongoose.Schema({ name: String, price: Number });
const Product = mongoose.model("Product", productSchema);
module.exports.Product = Product;

app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});