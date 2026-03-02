const express = require("express");
const Subject = require("../models/Subject");
const Stream = require("../models/Stream");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");

const router = express.Router();

// Subject CRUD routes. Supports listing by stream and admin management.

// PUBLIC: list subjects (optional filter by stream)
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.streamId) filter.stream = req.query.streamId;

  const subjects = await Subject.find(filter)
    .populate("stream", "name")
    .sort({ createdAt: -1 });

  res.json(subjects);
});

// ADMIN: create subject
router.post("/", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const { name, streamId } = req.body;

    // check stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) return res.status(400).json({ message: "Stream not found" });

    const subject = await Subject.create({ name, stream: streamId });
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: update subject
router.put("/:id", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: delete subject
router.delete("/:id", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
