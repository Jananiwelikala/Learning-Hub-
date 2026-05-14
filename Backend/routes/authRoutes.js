const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();
const PUBLIC_REGISTER_ROLES = ["student", "teacher"];

function createAuthToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function toAuthUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    stream: user.stream || "",
    alYear: user.alYear || "",
    subject: user.subject || "",
    teachingMode: user.teachingMode || "",
    institute: user.institute || "",
    district: user.district || "",
    qualifications: user.qualifications || "",
    experience: user.experience || "",
    bio: user.bio || "",
  };
}

function normalizeUserInput(body) {
  const role = String(body.role || "student").trim().toLowerCase();

  return {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    password: String(body.password || ""),
    role,
    stream: String(body.stream || body.streamId || "").trim(),
    alYear: String(body.alYear || "").trim(),
    subject: String(body.subject || "").trim(),
    teachingMode: String(body.teachingMode || "").trim(),
    institute: String(body.institute || "").trim(),
    district: String(body.district || "").trim(),
    qualifications: String(body.qualifications || "").trim(),
    experience: String(body.experience || "").trim(),
    bio: String(body.bio || "").trim(),
    subjects: Array.isArray(body.subjects)
      ? body.subjects.filter((subjectId) => mongoose.Types.ObjectId.isValid(subjectId))
      : [],
  };
}

router.post("/register", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured" });
    }

    const userInput = normalizeUserInput(req.body);

    if (!userInput.name || !userInput.email || !userInput.password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (userInput.password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!PUBLIC_REGISTER_ROLES.includes(userInput.role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid role for public registration",
      });
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(userInput.password, 10);
    const createdUser = await User.create({
      name: userInput.name,
      email: userInput.email,
      phone: userInput.phone,
      password: hashedPassword,
      role: userInput.role,
      stream: userInput.stream,
      alYear: userInput.alYear,
      subject: userInput.subject,
      teachingMode: userInput.teachingMode,
      institute: userInput.institute,
      district: userInput.district,
      qualifications: userInput.qualifications,
      experience: userInput.experience,
      bio: userInput.bio,
      subjects: userInput.subjects,
    });

    const token = createAuthToken(createdUser);

    return res.status(201).json({
      success: true,
      token,
      user: toAuthUser(createdUser),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured" });
    }

    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createAuthToken(user);

    return res.json({
      success: true,
      token,
      user: toAuthUser(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ success: false, message: "No token, access denied" });
    }

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: toAuthUser(user) });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
});

router.put("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ success: false, message: "No token, access denied" });
    }

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    const allowedFields = [
      "name",
      "phone",
      "stream",
      "alYear",
      "subject",
      "teachingMode",
      "institute",
      "district",
      "qualifications",
      "experience",
      "bio",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = String(req.body[field] || "").trim();
      }
    });

    const user = await User.findByIdAndUpdate(decoded.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: toAuthUser(user) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Profile update failed" });
  }
});

module.exports = router;
