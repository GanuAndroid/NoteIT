const express = require("express");
const router = express.Router();
const Note = require("../models/note"); // correct relative path
const SharedNote = require("../models/sharedNotes");

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

        res.status(201).json({
             status: 'success',
             message: "Note saved successfully", 
             data : newNote });
    } catch (err) {
        console.error("🔥 Error saving note:", err);
        res.status(500).json({
             status: 'error',
             message: "Failed to save note", 
             error: err.message });
    }
});

// Get notes for a specific user
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const notes = await Note.find({ userId }).sort({ date: -1 });

        if (!notes.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No notes found for this user.',
                data: null
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Notes fetched successfully.',
            data: notes
        });
    } catch (err) {
        console.error("Error fetching user notes:", err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user notes',
            error: err.message || 'Unknown error'
        });
    }
});

// Update a specific note for a user
router.put("/:userId/:noteId", async (req, res) => {
    try {
        const { userId, noteId } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                status: 'error',
                message: 'Title and content are required.',
                data: null
            });
        }

        // Update only the note that belongs to the given user
        const updatedNote = await Note.findOneAndUpdate(
            { _id: noteId, userId: userId },
            { title, content, date: new Date() },
            { new: true } // return the updated document
        );

        if (!updatedNote) {
            return res.status(404).json({
                status: 'error',
                message: "Note not found or you don't have permission to edit it.",
                data: null
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Note updated successfully',
            data: updatedNote
        });
    } catch (err) {
        console.error("🔥 Error updating note:", err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update note',
            error: err.message || 'Unknown error'
        });
    }
});

// Delete a specific note by its ID
const { successResponse, errorResponse } = require("../utils/apiResponse");

// Delete a specific note by its ID
router.delete("/:userId/:noteId", async (req, res) => {
  try {
     const { userId, noteId } = req.params;


    if (!userId || !noteId) {
      return errorResponse(res, "Note ID is required!", 400);
    }

    // Ensure the note belongs to the user
        const deletedNote = await Note.findOne({ _id: noteId, userId: userId });

    if (!deletedNote) {
      return errorResponse(res, "Note not found or you don't have permission to delete it", 404);
    }

  await Note.findByIdAndDelete(noteId);

    return successResponse(res, "Note deleted successfully", deletedNote, 200);
  } catch (err) {
    console.error("🔥 Error deleting note:", err);
    return errorResponse(res, "Failed to delete note", 500, err.message);
  }
});


// Add the toggle favorite route to your router
router.patch("/:userId/:noteId/favorite", async (req, res) => {
    try {
        const { userId, noteId } = req.params;

        // Find the note by ID and ensure it belongs to the user
        const note = await Note.findOne({ _id: noteId, userId });

        if (!note) {
            return res.status(404).json({
                status: 'error',
                message: "Note not found or you don't have permission to modify it.",
                data: null
            });
        }

        // Toggle the favorite status of the note
        note.isFavorite = !note.isFavorite;
        await note.save();

        res.status(200).json({
            status: 'success',
            message: `Note ${note.isFavorite ? 'marked as favorite' : 'removed from favorites'}`,
            data: note
        });
    } catch (err) {
        console.error(" Error updating favorite status:", err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update favorite status',
            error: err.message || 'Unknown error'
        });
    }
});




// Get all favorite notes for a user
router.get("/:userId/favorites", async (req, res) => {
    try {
        const { userId } = req.params;
        const favoriteNotes = await Note.find({ userId, isFavorite: true }).sort({ date: -1 });

        if (!favoriteNotes.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No favorite notes found for this user.',
                data: null
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Favorite notes fetched successfully.',
            data: favoriteNotes
        });
    } catch (err) {
        console.error("🔥 Error fetching favorite notes:", err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch favorite notes',
            error: err.message || 'Unknown error'
        });
    }
});



router.get("/user/shared-notes/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
        data: null,
      });
    }

    const sharedNotes = await SharedNote.find({
      $or: [{ sharedBy: userId }, { sharedTo: userId }],
    })
      .populate("noteId")
      .populate("sharedBy", "name mobile email")
      .populate("sharedTo", "name mobile email")
      .sort({ createdAt: -1 });

    const formattedData = sharedNotes.map((item) => {
      const isSharedByMe = item.sharedBy._id.toString() === userId;

      return {
        shareId: item._id,
        noteId: item.noteId?._id,
        title: item.noteId?.title,
        contentPreview: item.noteId?.content?.substring(0, 100),
        noteCreatedAt: item.noteId?.createdAt || item.noteId?.date,

        sharedAt: item.createdAt,
        permission: item.permission,

        sharedType: isSharedByMe
          ? "shared_by_me"
          : "shared_to_me",

        sharedBy: {
          id: item.sharedBy?._id,
          name: item.sharedBy?.name,
          mobile: item.sharedBy?.mobile,
        },

        sharedTo: {
          id: item.sharedTo?._id,
          name: item.sharedTo?.name,
          mobile: item.sharedTo?.mobile,
        },
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Shared notes fetched successfully",
      data: formattedData,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      data: null,
    });
  }
});



router.post("/share-note", async (req, res) => {
  try {
    const { noteId, ownerId, identifier, permission } = req.body;

    // 1️⃣ Validate input
    if (!noteId || !ownerId || !identifier) {
      return res.status(400).json({
        message: "noteId, ownerId and identifier are required",
      });
    }

    // 2️⃣ Check note exists
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // 3️⃣ Verify ownership
    if (note.userId.toString() !== ownerId) {
      return res.status(403).json({
         status: "error",
        message: "You are not owner of this note",
      });
    }

    // 4️⃣ Detect if identifier is email or mobile
    let query = {};

    if (identifier.includes("@")) {
      query.email = identifier;
    } else {
      query.mobile = identifier;
    }

    const userToShare = await User.findOne(query);

    if (!userToShare) {
      return res.status(404).json({
         status: "error",
        message: "User not found with this email/mobile",
      });
    }

    // 5️⃣ Prevent self share
    if (userToShare._id.toString() === ownerId) {
      return res.status(400).json({
        status: "error",
        message: "You cannot share note with yourself",
      });
    }

    // 6️⃣ Prevent duplicate share
    const existing = await SharedNote.findOne({
      noteId,
      sharedTo: userToShare._id,
    });

    if (existing) {
      return res.status(400).json({
         status: "error",
        message: "Note already shared with this user",
      });
    }

    // 7️⃣ Create share entry
    const sharedNote = new SharedNote({
      noteId,
      sharedBy: ownerId,
      sharedTo: userToShare._id,
      permission: permission || "read",
    });

    await sharedNote.save();

    return res.status(200).json({
         status: "success",
      message: "Note shared successfully",
      sharedTo: {
        id: userToShare._id,
        name: userToShare.name,
        mobile: userToShare.mobile,
        email: userToShare.email,
      },
      sharedAt: sharedNote.createdAt,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
