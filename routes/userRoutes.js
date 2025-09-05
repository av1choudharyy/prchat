const express = require("express");
const { registerUser, authUser, allUsers } = require("../controllers");
const { getAllUsers } = require("../controllers/messageControllers");
const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(registerUser).get(protect, allUsers); // Both request supported on the same route
router.route("/all").get(protect, getAllUsers);
router.post("/login", authUser);

module.exports = router;
