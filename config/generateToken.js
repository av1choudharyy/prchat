const jwt = require("jsonwebtoken");

const generateToken = (id, email) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }
    
    return jwt.sign({ id, email }, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRE || "7d" 
    });
  } catch (error) {
    console.error("JWT Generation Error:", error);
    throw new Error("Failed to generate authentication token");
  }
};

module.exports = generateToken;
