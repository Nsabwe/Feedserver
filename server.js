require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());

// ✅ CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

/* =========================
   SCHEMA (UNCHANGED DESIGN)
========================= */
const productSchema = new mongoose.Schema({
  name: String,
  priceNumber: Number,
  priceText: String,
  phone: String,
  location: String,
  category: String,
  images: [String],
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

/* =========================
   GET PRODUCTS (SEARCH + FILTER)
========================= */
app.get("/api/products", async (req, res) => {
  try {
    const { name, location, category } = req.query;

    let filter = {};

    // 🔍 Search by name
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // 📍 Search by location
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // 🏷️ Filter by category (FIXED)
    if (category && category !== "all") {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    // ✅ Fix images (prevent frontend crash)
    const fixedProducts = products.map(p => ({
      ...p._doc,
      images: p.images && p.images.length > 0
        ? p.images
        : ["https://via.placeholder.com/150"]
    }));

    res.json(fixedProducts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET SINGLE PRODUCT
========================= */
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const fixedProduct = {
      ...product._doc,
      images: product.images && product.images.length > 0
        ? product.images
        : ["https://via.placeholder.com/150"]
    };

    res.json(fixedProduct);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ADD PRODUCT (FIX CATEGORY)
========================= */
app.post("/api/products", async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      category: req.body.category
        ? req.body.category.toLowerCase()
        : "others" // default fallback
    });

    await newProduct.save();

    res.json({
      message: "Product added successfully",
      product: newProduct
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   DELETE PRODUCT (OPTIONAL)
========================= */
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   UPDATE PRODUCT (OPTIONAL)
========================= */
app.put("/api/products/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        category: req.body.category
          ? req.body.category.toLowerCase()
          : undefined
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});