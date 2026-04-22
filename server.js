require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// 📦 Schema (image is STRING base64)
const ProductSchema = new mongoose.Schema({
  name: String,
  price: String,
  phone: String,
  category: String,
  image: String // 👈 base64 stored here
});

const Product = mongoose.model("Product", ProductSchema);

// 📥 GET PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});