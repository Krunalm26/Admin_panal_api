const express = require("express");
const passport = require("passport"); // ✅ required to use passport
const router = express.Router();
const auth = require("../controllers/authController");

router.post("/signup", auth.signup);
router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password/:token", auth.resetPassword);

// 🔐 Protected route to delete user by ID
router.delete(
  "/delete/:id",
  passport.authenticate("jwt", { session: false }),
  auth.deleteUserById
);

// 🧪 Dev utility: delete all users
router.delete("/delete-all", async (req, res) => {
  const User = require("../models/User");
  await User.deleteMany({});
  res.json({ message: "All users deleted" });
});

// 👑 Get all admins (requires admin)
router.get(
  "/admins",
  passport.authenticate("jwt", { session: false }),
  auth.getAdmins
);

// 🧑 Get all users (NO authentication required)
router.get("/users", auth.getUsers);


module.exports = router;
