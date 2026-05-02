const express = require("express");
const ClassPost = require("../models/ClassPost");
const User = require("../models/User");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");

const router = express.Router();

// TEACHER: Get all posts by the authenticated teacher
router.get("/my-posts", auth, roleMiddleware("teacher"), async (req, res) => {
  try {
    const posts = await ClassPost.find({ teacher: req.user.id })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TEACHER: Create a new class post
router.post("/", auth, roleMiddleware("teacher"), async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      grade,
      location,
      schedule,
      duration,
      fee,
      contactInfo,
      status = "draft"
    } = req.body;

    const post = await ClassPost.create({
      title,
      description,
      subject,
      grade,
      location,
      schedule,
      duration,
      fee,
      contactInfo,
      teacher: req.user.id,
      status
    });

    await post.populate("teacher", "name email");

    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// TEACHER: Update own post
router.put("/:id", auth, roleMiddleware("teacher"), async (req, res) => {
  try {
    const post = await ClassPost.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Prevent updating approved posts
    if (post.status === "approved") {
      return res.status(400).json({
        message: "Cannot update approved posts. Contact admin to make changes."
      });
    }

    const updatedPost = await ClassPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("teacher", "name email");

    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// TEACHER: Delete own post
router.delete("/:id", auth, roleMiddleware("teacher"), async (req, res) => {
  try {
    const post = await ClassPost.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Prevent deleting approved posts
    if (post.status === "approved") {
      return res.status(400).json({
        message: "Cannot delete approved posts. Contact admin to remove."
      });
    }

    await ClassPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TEACHER: Submit post for approval
router.post("/:id/submit", auth, roleMiddleware("teacher"), async (req, res) => {
  try {
    const post = await ClassPost.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.status !== "draft") {
      return res.status(400).json({
        message: "Only draft posts can be submitted for approval"
      });
    }

    post.status = "pending";
    await post.save();

    res.json({ message: "Post submitted for approval", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get all posts (with filtering)
router.get("/admin", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.teacher) filter.teacher = req.query.teacher;

    const posts = await ClassPost.find(filter)
      .populate("teacher", "name email")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Approve or reject post
router.put("/:id/review", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const { status, rejectionReason = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const post = await ClassPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.status !== "pending") {
      return res.status(400).json({
        message: "Only pending posts can be reviewed"
      });
    }

    post.status = status;
    post.approvedBy = req.user.id;
    post.approvedAt = new Date();
    if (status === "rejected") {
      post.rejectionReason = rejectionReason;
    }

    await post.save();
    await post.populate("teacher", "name email");
    await post.populate("approvedBy", "name");

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Get approved posts for students
router.get("/approved", async (req, res) => {
  try {
    const filter = { status: "approved" };

    // Optional filters
    if (req.query.subject) filter.subject = new RegExp(req.query.subject, "i");
    if (req.query.grade) filter.grade = new RegExp(req.query.grade, "i");
    if (req.query.location) filter.location = new RegExp(req.query.location, "i");

    const posts = await ClassPost.find(filter)
      .populate("teacher", "name email phone")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Get single approved post
router.get("/approved/:id", async (req, res) => {
  try {
    const post = await ClassPost.findOne({
      _id: req.params.id,
      status: "approved"
    }).populate("teacher", "name email phone");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;