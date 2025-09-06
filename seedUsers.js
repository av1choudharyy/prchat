const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User"); // adjust if model path differs

const users = [
  { name: "Test User1", email: "test1@example.com", password: "password123" },
  { name: "Test User2", email: "test2@example.com", password: "password123" },
  { name: "Test User3", email: "test3@example.com", password: "password123" },
  { name: "Guest User", email: "guest@example.com", password: "123456" },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear existing users to avoid duplicates
    await User.deleteMany();

    // Hash passwords
    const hashedUsers = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
      }))
    );

    await User.insertMany(hashedUsers);
    console.log("✅ Test users seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
};

seedUsers();
