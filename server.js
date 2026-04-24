require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// PRODUCT SCHEMA
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // can be string OR array handled below
  phone: String,
  location: String,
  category: {
    type: String,
    enum: ["phone", "clothes", "land", "cars", "other"],
    default: "other"
  }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

/* =========================
   GET PRODUCTS (FIXED)
========================= */
app.get("/products", async (req, res) => {
  try {
    let { category, name, location, search } = req.query;

    let filter = {};

    // ✅ FIX CATEGORY MISMATCH (frontend vs backend)
    if (category && category !== "all") {
      const map = {
        car: "cars",
        cars: "cars",
        phone: "phone",
        clothes: "clothes",
        land: "land",
        others: "other",
        other: "other"
      };

      filter.category = map[category.toLowerCase()] || category.toLowerCase();
    }

    // NAME FILTER
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // LOCATION FILTER
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // GENERAL SEARCH
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    // ✅ FIX IMAGE FORMAT FOR FRONTEND
    const fixedProducts = products.map(p => ({
      ...p._doc,
      image: p.image ? p.image : "https://via.placeholder.com/150"
    }));

    res.json(fixedProducts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ADD PRODUCT
========================= */
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

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});