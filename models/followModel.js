const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
          },
        followerId: {
            type: String,
            required: true,
          },
   
      },
  { timestamps: true }      
);

module.exports = mongoose.model('followModel', followSchema);
