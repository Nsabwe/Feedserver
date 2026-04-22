require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// CONNECT TO MONGODB USING .ENV
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// PRODUCT SCHEMA
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  phone: String,
  location: String,
  category: {
    type: String,
    enum: ["phones", "clothes", "land", "cars", "other"],
    default: "other"
  }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);


// ✅ GET PRODUCTS (MAIN FEATURE)
app.get("/products", async (req, res) => {
  try {
    let { category, search } = req.query;

    let filter = {};

    // CATEGORY LOGIC
    if (category && category !== "all") {
      filter.category = category.toLowerCase();
    }

    // SEARCH LOGIC (name + location)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ ADD PRODUCT (FOR TESTING / ADMIN)
app.post("/products", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    res.json({
      message: "Product added successfully",
      product: newProduct
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});