const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
    {
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "commentModel",
            required: true,
          },
        userId: {
            type: String,
            required: true,
          },
        like: {
            type: Boolean,
            required: true,
          },
   
      },
  { timestamps: true }      
);

module.exports = mongoose.model('likeModel', likeSchema);
