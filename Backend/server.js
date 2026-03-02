const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const lessonRoutes = require("./routes/lessonRotes");

const User = require("./models/User");
const auth = require("./Middleware/auth");
const roleMiddleware = require("./Middleware/roleMiddleware");

const streamRoutes = require("./routes/streamRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();

// Global middleware for CORS and JSON request bodies.
app.use(cors());
app.use(express.json());

// Feature routes (auth checks are handled inside each route file where needed).
app.use("/api/streams", streamRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/lessons", lessonRoutes);

// Quick health endpoint for uptime checks.
app.get("/health", (req, res) => res.send("OK"));

// Register a new user.
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Prevent duplicate accounts by email.
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Store only hashed passwords.
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role, // admin/teacher/student (based on your enum)
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login and issue a signed JWT token.
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate user existence and password.
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Include minimal identity data in token payload.
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

// Example protected route: only admins can access this.
app.get("/api/admin", auth, roleMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome admin" });
});

// Start server only after DB connection succeeds.
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));

