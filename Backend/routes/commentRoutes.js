const express = require("express");
const Comment = require("../models/Comment");
const ClassPost = require("../models/ClassPost");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");

const router = express.Router();

// Get all comments for a specific post
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      status: "active"
    })
      .populate("author", "name email")
      .sort({ createdAt: 1 }); // Oldest first for threading

    // Organize comments into threads
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      commentMap[comment._id] = { ...comment.toObject(), replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parentComment) {
        if (commentMap[comment.parentComment]) {
          commentMap[comment.parentComment].replies.push(commentMap[comment._id]);
        }
      } else {
        rootComments.push(commentMap[comment._id]);
      }
    });

    res.json(rootComments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new comment
router.post("/", auth, async (req, res) => {
  try {
    const { content, postId, parentCommentId = null } = req.body;

    // Verify post exists and is approved
    const post = await ClassPost.findOne({ _id: postId, status: "approved" });
    if (!post) {
      return res.status(404).json({ message: "Post not found or not approved" });
    }

    // If replying, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    }

    const comment = await Comment.create({
      content,
      post: postId,
      author: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      parentComment: parentCommentId,
      isReply: !!parentCommentId,
    });

    await comment.populate("author", "name email");

    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update own comment
router.put("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      author: req.user.id,
      status: "active"
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const { content } = req.body;
    comment.content = content;
    await comment.save();

    await comment.populate("author", "name email");

    res.json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete own comment (soft delete)
router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      author: req.user.id,
      status: "active"
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.status = "deleted";
    await comment.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TEACHER: Get comments on their posts
router.get("/my-posts", auth, roleMiddleware("teacher"), async (req, res) => {
  try {
    // Find all posts by this teacher
    const teacherPosts = await ClassPost.find({
      teacher: req.user.id,
      status: "approved"
    }).select("_id");

    const postIds = teacherPosts.map(post => post._id);

    const comments = await Comment.find({
      post: { $in: postIds },
      status: "active"
    })
      .populate("post", "title")
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Moderate comments
router.put("/:id/moderate", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "hidden", "deleted"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.status = status;
    await comment.save();

    await comment.populate("author", "name email");
    await comment.populate("post", "title");

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
