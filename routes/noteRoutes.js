const express = require("express");
const router = express.Router();
const Note = require("../models/note"); // correct relative path

// Create a new note
router.post("/", async (req, res) => {
    try {
        const { userId, title, content } = req.body;
        console.log("Incoming request body:", req.body);

        if (!userId || !title || !content) {
            return res.status(400).json({ error: "UserId, title, and content are required." });
        }

        const newNote = new Note({ userId, title, content, date: new Date() });
        await newNote.save();

        res.status(201).json({ message: "Note saved successfully", note: newNote });
    } catch (err) {
        console.error("🔥 Error saving note:", err);
        res.status(500).json({ error: "Failed to save note", details: err.message });
    }
});

//Get notes for a specific user
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const notes = await Note.find({ userId }).sort({ date: -1 });

        if (!notes.length) {
            return res.status(404).json({ message: "No notes found for this user." });
        }

        res.status(200).json(notes);
    } catch (err) {
        console.error("🔥 Error fetching user notes:", err);
        res.status(500).json({ error: "Failed to fetch user notes" });
    }
});

// Update a specific note
router.put("/:userId/:noteId", async (req, res) => {
    try {
        const { userId, noteId } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required." });
        }
        // Update only the note that belongs to the given user
        const updatedNote = await Note.findOneAndUpdate(
            { _id: noteId, userId: userId },
            { title, content, date: new Date() },
            { new: true } // return the updated document
        );

        if (!updatedNote) {
            return res.status(404).json({ error: "Note not found or you don't have permission to edit it." });
        }

        res.status(200).json({ message: "Note updated successfully", note: updatedNote });
    } catch (err) {
        console.error("🔥 Error updating note:", err);
        res.status(500).json({ error: "Failed to update note", details: err.message });
    }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Note ID is required!" });
    }

    const deletedNote = await Note.findByIdAndDelete(id);

    if (!deletedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted successfully", note: deletedNote });
  } catch (err) {
    console.error("🔥 Error deleting note:", err);
    res.status(500).json({ error: "Failed to delete note", details: err.message });
  }
});





//Get all notes
router.get("/", async (req, res) => {
    try {
        const notes = await Note.find().sort({ date: -1 });
        res.status(200).json(notes);
    } catch (err) {
        console.error("🔥 Error fetching notes:", err);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});

module.exports = router;
