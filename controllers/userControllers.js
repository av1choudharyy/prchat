const { User } = require("../models");
const {
  generateToken,
  generateHashedPassword,
  verifyPassword,
} = require("../config");

// @description     Register new user
// @route           POST /api/user/
// @access          Public
const registerUser = async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Please enter all the fields",
    });
  }

  const userExists = await User.findOne({ email }).exec();

  if (userExists) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "User already exists",
    });
  }

  const userCreated = await User.create(
    pic === undefined || pic.length === 0
      ? {
          name,
          email,
          password: await generateHashedPassword(password),
        }
      : {
          name,
          email,
          password: await generateHashedPassword(password),
          pic,
        }
  );

  if (userCreated) {
    return res.status(201).json({
      success: true,
      statusCode: 201,
      _id: userCreated._id,
      name: userCreated.name,
      email: userCreated.email,
      pic: userCreated.pic,
      token: generateToken(userCreated._id, userCreated.email),
      message: "User Created Successfully",
    });
  } else {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to create the User",
    });
  }
};

// @description     Auth the user
// @route           POST /api/user/login
// @access          Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Please enter all the fields",
    });
  }

  const userExists = await User.findOne({ email }).exec();

  if (userExists && (await verifyPassword(password, userExists.password))) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      _id: userExists._id,
      name: userExists.name,
      email: userExists.email,
      pic: userExists.pic,
      token: generateToken(userExists._id, userExists.email),
      message: "Authenticated Successfully",
    });
  } else {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid Email or Password",
    });
  }
};

// @description     Get or Search all users
// @route           GET /api/user?search=
// @access          Public
const allUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const userExists = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .exec();

  return res.status(200).json(userExists);
};

// @description     Guest Login (auto create if not exists)
// @route           GET /api/user/guest
// @access          Public
const guestLogin = async (req, res) => {
  try {
    const guestEmail = "guest@prchat.com";

    let user = await User.findOne({ email: guestEmail }).exec();

    if (!user) {
      user = await User.create({
        name: "Guest User",
        email: guestEmail,
        password: await generateHashedPassword("guest123"),
        pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      });
    }

    return res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id, user.email),
      message: "Guest login successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to login as guest",
    });
  }
};

module.exports = { registerUser, authUser, allUsers, guestLogin };
