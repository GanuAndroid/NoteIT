const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
   isFavorite: {
      type: Boolean,
      default: false,  // Default value is false
    },
}, {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;   // rename _id → id
        delete ret._id;     // remove _id
        delete ret.__v;     // remove __v
        return ret;
      },
    },
  }

);

module.exports = mongoose.model("Note", NoteSchema);
