const mongoose = require('mongoose');
const crypto = require('crypto'); 

 
const settingsSchema = new mongoose.Schema(
  {
    key: {  
        type: String,
        required: true
    },
    value: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);
 

module.exports = mongoose.model('SettingsModel', settingsSchema);
