const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// Create JWT token
const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

// Sign up new user
exports.signup = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.create({ email, password, role });
    res.status(201).json({ message: "User created", user: user.email });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
};

// Log in existing user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = createToken(user._id);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: false, // Change to true in production with HTTPS
    maxAge: 86400000,
  });

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      email: user.email,
    },
  });
};

// Log out user
exports.logout = (req, res) => {
  res.clearCookie("jwt");
  res.json({ message: "Logged out" });
};

// Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpire = Date.now() + 3600000;
  await user.save();

  const resetUrl = `http://localhost:${process.env.PORT}/api/auth/reset-password/${token}`;
  await sendEmail(
    user.email,
    "Reset Password",
    `Reset your password using this link: ${resetUrl}`
  );

  res.json({ message: "Reset link sent" });
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  user.password = req.body.password;
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
};

// Delete user by email
exports.deleteUser = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await User.findOneAndDelete({ email });
    if (!result) return res.status(404).json({ error: "User not found" });
    res.json({ message: `User with email ${email} deleted` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update user email or password
exports.updateUser = async (req, res) => {
  const { oldEmail, newEmail, newPassword } = req.body;

  try {
    const user = await User.findOne({ email: oldEmail });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (newEmail) user.email = newEmail;
    if (newPassword) user.password = newPassword;

    await user.save();
    res.json({ message: "User updated", user: user.email });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Delete user by ID
exports.deleteUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: `User with ID ${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Helper: check if user is admin
function isAdmin(user) {
  return user && user.role === "admin";
}

// ✅ PUBLIC: Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }, "_id email role");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ PUBLIC: Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }, "_id email role");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
