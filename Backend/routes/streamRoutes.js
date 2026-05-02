const express = require("express");
const Stream = require("../models/Stream");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");

const router = express.Router();

// Stream CRUD routes. Read is public; write actions are admin-only.

// PUBLIC: list streams
router.get("/", async (req, res) => {
  try {
    const streams = await Stream.find().sort({ createdAt: -1 });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: create stream
router.post("/", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const stream = await Stream.create({ name, description });
    res.status(201).json(stream);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: update stream
router.put("/:id", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    const updated = await Stream.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: delete stream
router.delete("/:id", auth, roleMiddleware("admin"), async (req, res) => {
  try {
    await Stream.findByIdAndDelete(req.params.id);
    res.json({ message: "Stream deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
