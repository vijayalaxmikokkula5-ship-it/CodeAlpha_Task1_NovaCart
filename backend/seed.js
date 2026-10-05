require("dotenv").config();

const Product = require("./models/Product");
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const products = [
  {
    name: "Wireless Headphones",
    category: "Electronics",
    description: "Comfortable wireless headphones with clear sound and long battery life.",
    price: 1499,
    stock: 25,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
  },
  {
    name: "Smart Watch",
    category: "Electronics",
    description: "Smart watch with fitness tracking, notifications and modern design.",
    price: 2499,
    stock: 18,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
  },
  {
    name: "Laptop Backpack",
    category: "Accessories",
    description: "Durable backpack suitable for laptops, college and daily travel.",
    price: 999,
    stock: 30,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
  },
  {
    name: "Running Shoes",
    category: "Fashion",
    description: "Lightweight running shoes designed for everyday comfort.",
    price: 1999,
    stock: 20,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
  },
  {
    name: "Classic T-Shirt",
    category: "Fashion",
    description: "Comfortable cotton T-shirt suitable for everyday wear.",
    price: 599,
    stock: 40,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
  },
  {
    name: "Coffee Mug",
    category: "Home",
    description: "Simple ceramic coffee mug for home and office use.",
    price: 299,
    stock: 50,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d"
  },
  {
    name: "Desk Lamp",
    category: "Home",
    description: "Modern LED desk lamp perfect for studying and working.",
    price: 799,
    stock: 22,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c"
  },
  {
    name: "Water Bottle",
    category: "Lifestyle",
    description: "Reusable stainless-steel water bottle for everyday use.",
    price: 699,
    stock: 35,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8"
  }
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing. Please check your backend/.env file."
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    await Product.deleteMany({});

    await Product.insertMany(products);

    console.log(`${products.length} products added successfully!`);

    await mongoose.connection.close();

    console.log("Database connection closed.");
  } catch (error) {
    console.error("Seeding failed:", error.message);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

seed();