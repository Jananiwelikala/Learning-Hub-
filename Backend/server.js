const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const lessonRoutes = require("./routes/lessonRotes");
const mcqRoutes = require("./routes/mcqRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const seedSampleData = require("./seedSampleData");

const User = require("./models/User");
const auth = require("./Middleware/auth");
const roleMiddleware = require("./Middleware/roleMiddleware");

const streamRoutes = require("./routes/streamRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const classPostRoutes = require("./routes/classPostRoutes");
const commentRoutes = require("./routes/commentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const publicRoutes = require("./routes/publicRoutes");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PUBLIC_REGISTER_ROLES = ["student", "teacher"];

// CORS configuration for development and production
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3007',
      'http://localhost:3008',
      'http://localhost:3009',
      'http://localhost:3010',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Feature routes (auth checks are handled inside each route file where needed).
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/class-posts", classPostRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/mcqs", mcqRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/public", publicRoutes);

// Quick health endpoint for uptime checks.
app.get("/health", (req, res) => res.send("OK"));

// Register a new user.
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, streamId, password, role, title } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();
    const normalizedPhone = String(phone || "").trim();
    const selectedRole = String(role || "student").trim().toLowerCase();
    const normalizedTitle = ["Mr.", "Mrs.", "Miss"].includes(String(title || "").trim())
      ? String(title || "").trim()
      : "";

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Public signup is limited to student/teacher roles.
    if (!PUBLIC_REGISTER_ROLES.includes(selectedRole)) {
      return res.status(403).json({
        message: "Invalid role for public registration",
      });
    }

    // Prevent duplicate accounts by email.
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Store only hashed passwords.
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      name: normalizedName,
      title: selectedRole === "teacher" ? normalizedTitle : "",
      email: normalizedEmail,
      phone: normalizedPhone,
      streamId: streamId || null,
      password: hashedPassword,
      role: selectedRole,
    });

    const token = jwt.sign(
      { id: createdUser._id, role: createdUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: createdUser._id,
        title: createdUser.title || "",
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login and issue a signed JWT token.
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Validate user existence and password.
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Include minimal identity data in token payload.
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        title: user.title || "",
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Current authenticated user profile.
app.get("/api/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Role-restricted examples.
app.get("/api/admin", auth, roleMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome admin", role: req.user.role });
});

app.get("/api/teacher", auth, roleMiddleware("teacher"), (req, res) => {
  res.json({ message: "Welcome teacher", role: req.user.role });
});

app.get("/api/student", auth, roleMiddleware("student"), (req, res) => {
  res.json({ message: "Welcome student", role: req.user.role });
});

// Admin-only user management with explicit role assignment.
app.post("/api/admin/users", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const { name, email, password, role, title } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();
    const selectedRole = String(role || "").trim().toLowerCase();
    const normalizedTitle = ["Mr.", "Mrs.", "Miss"].includes(String(title || "").trim())
      ? String(title || "").trim()
      : "";
    const allowedRoles = ["student", "teacher", "admin"];

    if (!normalizedName || !normalizedEmail || !password || !selectedRole) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await User.create({
      name: normalizedName,
      title: selectedRole === "teacher" ? normalizedTitle : "",
      email: normalizedEmail,
      password: hashedPassword,
      role: selectedRole,
    });

    res.status(201).json({
      message: "User created successfully",
      user: { id: created._id, title: created.title || "", name: created.name, email: created.email, role: created.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server only after DB connection succeeds.
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await seedSampleData();
    console.log("Sample learning data is ready");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
