const bcrypt = require("bcryptjs");

const verifyPassword = async (enteredPassword, existingPassword) => {
  try {
    if (!enteredPassword || !existingPassword) {
      throw new Error("Password parameters are required");
    }
    
    // Returns True if the password entered by the user matches
    return await bcrypt.compare(enteredPassword, existingPassword);
  } catch (error) {
    console.error("Password Verification Error:", error);
    return false; // Return false on any error for security
  }
};

module.exports = verifyPassword;
