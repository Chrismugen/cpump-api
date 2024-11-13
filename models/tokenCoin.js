const mongoose = require('mongoose');

const tokenCoinSchema = new mongoose.Schema(
    {
        name: {
          type: String,
          required: true
        },
        symbol: {
          type: String,
          required: true
        },
        // decimal: {
        //   type: Number,
        //   required: true
        // },
        twitterLink: {
          type: String,
          required: false
        },
        telegramLink: {
          type: String,
          required: false
        },
        websiteLink: {
          type: String,
          required: false
        },
        desc: {
          type: String,
          required: false
        },
        image: {
          type: String,
          required: true
        },
        isToken: {
          type: Boolean,
          required: true
        },
        published: {
          type: Boolean,
          default: false
        },
        verified: {
          type: Boolean,
          default: false
        },
        status: {
          type: Number,
          default: false
        },
        marketValue: {
          type: Number,
          default: false
        },
        tokenSold: {
          type: String,
          default: false
        },
        buyPrice: {
          type: String,
          default: false
        },
        sellPrice: {
          type: String,
          default: false
        },
        address:{
          type: String
        },
        chain: {
          type: String,
          required: true
        },
        createdBy:{
          type:String,
          required: true
        }
       
      },
  { timestamps: true }
);

module.exports = mongoose.model('tokenCoin', tokenCoinSchema);
