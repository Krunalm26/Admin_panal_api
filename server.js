require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const passport = require("passport");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
require("./config/passport")(passport);
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("Admin Panel API is Running ✅");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
