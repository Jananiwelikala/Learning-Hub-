const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Import User model
const User = require("./models/User");

// ✅ Debug: check if User is a real mongoose model (should be a function)
console.log("User import type:", typeof User);
console.log("User keys:", User && typeof User === "object" ? Object.keys(User) : "N/A");

const auth = require("./Middleware/auth");
const roleMiddleware = require("./Middleware/roleMiddleware");

// Import Express framework (used to create the server)
const express = require("express");

// Import Mongoose (used to connect and talk to MongoDB)
const mongoose = require("mongoose");

// Import CORS (allows frontend to talk to backend)
const cors = require("cors");

// Load environment variables from .env file
require("dotenv").config();

// Create an Express application
const app = express();

/* ======================
   MIDDLEWARE SECTION
   ====================== */
app.use(cors());
app.use(express.json());

/* ======================
   DATABASE CONNECTION
   ====================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ======================
   ROUTES
   ====================== */

// health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email }); // <-- your error happens here if User is wrong
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only route
app.get("/api/admin", auth, roleMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome admin" });
});

/* ======================
   SERVER START
   ====================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
