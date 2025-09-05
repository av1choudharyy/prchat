const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "./.env") });

console.log("🔍 PRChat Login Debug Tool");
console.log("==========================");

// Check environment variables
console.log("\n📋 Environment Variables Check:");
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`PORT: ${process.env.PORT || 'NOT SET'}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI ? '✅ SET' : '❌ NOT SET'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'}`);
console.log(`JWT_EXPIRE: ${process.env.JWT_EXPIRE || 'NOT SET'}`);

// Test database connection
async function testDatabase() {
  try {
    const mongoose = require("mongoose");
    console.log("\n🗄️ Testing Database Connection...");
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ Database connected successfully");
    
    // Test user lookup
    const User = require("./models/User");
    const testUser = await User.findOne({ email: "test1@example.com" });
    
    if (testUser) {
      console.log("✅ Test user found in database");
      console.log(`   Name: ${testUser.name}`);
      console.log(`   Email: ${testUser.email}`);
    } else {
      console.log("❌ Test user not found in database");
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.log("❌ Database connection failed:");
    console.log(`   Error: ${error.message}`);
  }
}

// Test JWT token generation
function testJWT() {
  try {
    console.log("\n🔐 Testing JWT Token Generation...");
    const generateToken = require("./config/generateToken");
    const token = generateToken("test_id", "test@example.com");
    console.log("✅ JWT token generated successfully");
    console.log(`   Token length: ${token.length} characters`);
  } catch (error) {
    console.log("❌ JWT token generation failed:");
    console.log(`   Error: ${error.message}`);
  }
}

// Test password hashing and verification
async function testPassword() {
  try {
    console.log("\n🔒 Testing Password Functions...");
    const generateHashedPassword = require("./config/generateHashedPassword");
    const verifyPassword = require("./config/verifyPassword");
    
    const testPassword = "password123";
    const hashedPassword = await generateHashedPassword(testPassword);
    console.log("✅ Password hashing works");
    
    const isValid = await verifyPassword(testPassword, hashedPassword);
    console.log(`✅ Password verification works: ${isValid}`);
    
    const isInvalid = await verifyPassword("wrongpassword", hashedPassword);
    console.log(`✅ Password rejection works: ${!isInvalid}`);
  } catch (error) {
    console.log("❌ Password functions failed:");
    console.log(`   Error: ${error.message}`);
  }
}

// Main debug function
async function runDebug() {
  testJWT();
  await testPassword();
  await testDatabase();
  
  console.log("\n🎯 Quick Fix Suggestions:");
  console.log("1. Make sure MongoDB is running");
  console.log("2. Check .env file has all required variables");
  console.log("3. Verify test users exist in database");
  console.log("4. Check server logs for specific errors");
  console.log("\n💡 Test login with: test1@example.com / password123");
}

runDebug().catch(console.error);
