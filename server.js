const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // if your HTML is in /public

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/ourmarket", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productSchema = new mongoose.Schema({
  name: String,
  price: String,
  image: String,
  phone: String,
  location: String,
  category: String,
});

const Product = mongoose.model("Product", productSchema);

// GET PRODUCTS (with search + category filter)
app.get("/products", async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = {};

    // category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // search filter
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add product (optional for sell page)
app.post("/products", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ message: "Product added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});