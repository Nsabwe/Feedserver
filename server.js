require("dotenv").config(); // Load env first

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ======================
// ✅ MIDDLEWARE
// ======================
app.use(express.json());
app.use(cors());

// ======================
// ✅ MONGODB CONNECTION
// ======================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB connected successfully");
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// ======================
// ✅ CONNECTION EVENTS
// ======================
mongoose.connection.on("connected", () => {
  console.log("📡 Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️ Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected");
});

// ======================
// ✅ PRODUCT SCHEMA
// ======================
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number, // ✅ FIXED (was String)
    required: true
  },
  category: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model("Product", productSchema);

// ======================
// ✅ TEST ROUTE (DB CHECK)
// ======================
app.get("/test-db", async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.json({
      message: "✅ Database is working",
      totalProducts: count
    });
  } catch (err) {
    res.status(500).json({
      error: "❌ Database error"
    });
  }
});

// ======================
// ✅ GET PRODUCTS (FILTER + SEARCH)
// ======================
app.get("/products", async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = {};

    if (category && category !== "all; clothes;car;land; others; phone") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// ✅ ADD PRODUCT
// ======================
app.post("/products", async (req, res) => {
  try {
    const { name, price, category, image, phone, location } = req.body;

    // ✅ VALIDATION
    if (!name || !price || !category || !phone || !location) {
      return res.status(400).json({
        error: "All required fields must be filled"
      });
    }

    const newProduct = new Product({
      name,
      price,
      category,
      image,
      phone,
      location
    });

    await newProduct.save();

    res.json({
      message: "✅ Product added successfully",
      product: newProduct
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "❌ Failed to add product"
    });
  }
});

// ======================
// ✅ DELETE PRODUCT
// ======================
app.delete("/products/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.json({
      message: "✅ Deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      error: "❌ Delete failed"
    });
  }
});

// ======================
// ✅ START SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
