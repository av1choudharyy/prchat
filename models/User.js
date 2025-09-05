const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    pic: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // ✅ stable image
    },


  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
