const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    replyTo: {
      type: String,
      required: false,
      default: null,
    },
    image: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("commentModel", commentSchema);
