const mongoose = require('mongoose');

const coinTradechema = new mongoose.Schema(
    {
        project: {
          type: String,
          required: true
        },
        user: {
          type: String,
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        tokens: {
          type: Number,
          required: true
        },
        timestamp: {
          type: Number,
          required: true
        },
        openPrice: {
          type: Number,
          required: true
        },
        closePrice: {
          type: Number,
          required: true
        },
        buy: {
          type: Boolean,
          required: true
        }
      },
  { timestamps: true }
);

module.exports = mongoose.model('coinTrade', coinTradechema);
