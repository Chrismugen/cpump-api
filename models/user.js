const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        address: {
            type: String,
            required: true,
          },
        username: {
            type: String,
            required: true,
          },
        image: {
            type: String,
            required: false,
          },
        bio: {
            type: String,
            required: false,
          },
   
      },
  { timestamps: true }      
);

module.exports = mongoose.model('userModel', userSchema);
