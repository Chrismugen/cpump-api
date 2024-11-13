const Tokencoin = require("../models/tokenCoin");
const Comments = require("../models/commentModel");
const UserModel = require("../models/user");
const formidable = require("formidable");
const fs = require("fs");
const AWS = require("aws-sdk");
const CONTRIBUTE_ABI = require('../utils/CONTRIBUTE_ABI.json');
const TOKEN_ABI = require('../utils/TOKEN_ABI.json');
const { ethers, formatEther, parseEther } = require("ethers");
const commentModel = require("../models/commentModel");
const { default: mongoose } = require("mongoose");

const provider = new ethers.JsonRpcProvider("https://rpc-core-cpump.icecreamswap.com");

const getContract = (contractAddress, contractAbi, signerOrProvider) => {
  return new ethers.Contract(contractAddress, contractAbi, signerOrProvider);
};

const contributeContractAddress = process.env.CONTRIBUTE_CONTRACT;
const contributeContract = getContract(contributeContractAddress, CONTRIBUTE_ABI, provider);


const s3Client = new AWS.S3({
  secretAccessKey: process.env.ACCESS_KEY,
  accessKeyId: process.env.ACCESS_ID,
  region: process.env.region,
});
exports.createTokencoin = async (req, res) => {
  const form = new formidable.IncomingForm({
    maxFileSize: 1 * 1024 * 1024,
    multiples: true,
  });

  form.parse(req, async (err, fields, files) => {
    const {
      name,
      symbol,
      twitterLink,
      telegramLink,
      websiteLink,
      desc,
      isToken,
      chain
    } = fields;
    if (err) {
      return res.status(500).json({ error: "Error parsing form data -> " + err });
    }

    if (files.image) {
      const oldpath = files.image.filepath;
      const fileName = files.image.originalFilename;

      fs.readFile(oldpath, function (err, buffer) {
        if (err) {
          return res.status(500).json({ error: "Error reading file -> " + err });
        }
        const params = {
          Bucket: process.env.IMAGE_BUCKET,
          Key: fileName,
          Body: buffer,
        };

        s3Client.upload(params, async (err, s3data) => {
          if (err) {
            return res.status(500).json({ error: "Error uploading file to S3 -> " + err });
          }
          try {
            const createdBy = req.user.userId
            const tokencoin = new Tokencoin({
              image: s3data.Location,
              name,
              symbol,
              twitterLink,
              telegramLink,
              websiteLink,
              desc,
              isToken,
              chain,
              createdBy:createdBy
            });
            await tokencoin.save();
            res.status(201).json({
              status: true,
              message: "Coin created successfully",
              data: tokencoin,
            });
          } catch (error) {
            res.status(500).json({
              status: false,
              message: "Error saving Tokencoin",
              error: error.message,
            });
          }
        });
      });
    } else {
      res.status(400).json({ error: "No file provided" });
    }
  });
};

exports.getCurrentPrice = async(projectId) => {
  const currentPrice = await contributeContract.getBuyTokens(projectId,false,parseEther('1')); 
  // console.log("currentPricecurrentPrice", currentPrice);
  
  const _currentPrice  = currentPrice ? parseFloat(1/formatEther(currentPrice?.[0]))  : 0;
  return _currentPrice;
}


exports.getTokencoin = async (req, res) => {
  try {
    const coinsData = await Tokencoin.find({published: true, status: 1});
    if (coinsData.length === 0) {
      return res.status(404).json({ status: false, message: "No Tokencoin found" });
    }
    // Fetch comments for each Tokencoin
    // const coinsWithComments = await Promise.all(
    //   coinsData.map(async (coin) => {
    //     const user = await UserModel.findOne({ _id: coin?.createdBy});
    //     const commentData = await commentModel.find({ projectId: coin._id,replyTo: null });
    //     return { ...coin._doc,username: user.username, commentData };
    //   })
    // );

    res.status(200).json({
      status: true,
      message: "Tokencoin fetched successfully",
      coinsData: coinsData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching Tokencoins",
      error: error.message,
    });
  }
};

exports.getCrownToken = async (req, res) => {
  try {
  
    const coinsData = await Tokencoin.findOne({ published: true, status: 1 ,  marketValue : { $ne: null} }).sort({ marketValue: -1 });
    if (!coinsData) {
      return res.status(404).json({ status: false, message: "No Tokencoin found" });
    }

    const user = await UserModel.findOne({ _id: coinsData?.createdBy});

    // const comments = await Comments.find({ projectId: coinsData._id ,replyTo: null  });
    res.status(200).json({
      status: true,
      message: "Tokencoin fetched successfully",
      coinsData,
      username: user.username,
      comments: 0
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching Tokencoins",
      error: error.message,
    });
  }
};

exports.getHotpickscoin = async (req, res) => {
  try {
    const coinsData = await Tokencoin.find();
    if (coinsData.length === 0) {
      return res.status(404).json({ status: false, message: "No Tokencoin found" });
    }
    res.status(200).json({
      status: true,
      message: "Tokencoin fetched successfully",
      coinsData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching Tokencoins",
      error: error.message,
    });
  }
};

exports.getCoinById = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Tokencoin.findOne({ _id: id });
    if (!data) {
      return res
        .status(404)
        .json({ status: false, message: "Tokencoin not found" });
    }
    res
      .status(200)
      .json({ status: true, message: "Tokencoin fetched successfully", data });
  } catch (error) {
    res
      .status(500)
      .json({
        status: false,
        message: "Error fetching data",
        error: error.message,
      });
  }
};
exports.getCoinsByCreatedBy = async (req, res) => {
  try {
    
    const createdBy = req.params.createdBy;
    
    const coins = await Tokencoin.find({ createdBy });
    if (!coins.length) {
      return res
        .status(404)
        .json({ status: false, message: "No tokens found for this user" });
    }
    const coinsWithComments = await Promise.all(
      coins.map(async (coin) => {
        const commentData = await commentModel.find({ projectId: coin._id,replyTo: null });
        return { ...coin._doc, commentData };
      })
    );
    res
      .status(200)
      .json({ status: true, message: "Tokens fetched successfully", data: coinsWithComments });
  } catch (error) {
    res
      .status(500)
      .json({
        status: false,
        message: "Error fetching data",
        error: error.message,
      });
  }
};
exports.deleteCoin = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Tokencoin.deleteOne({ _id: id });
    if (!result) {
      return res
        .status(404)
        .json({ status: false, message: "Tokencoin not found" });
    }
    res.status(200).json({
      status: true,
      message: "Tokencoin deleted successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error deleting Tokencoin",
      error: error.message,
    });
  }
};
exports.getTokenHeld = async (req, res) => {
  const userId = req.params.id

  try {
    const coinsData = await Tokencoin.find({published:true});
    
    if (coinsData.length === 0) {
      return res.status(404).json({ status: false, message: "No Tokencoin found" });
    }
    const tokenHold = await UserModel.findOne({ _id: userId});
    let tokenData=[]
    
    for (const token of coinsData) {
      const tokenContract = await  getContract(token.address, TOKEN_ABI, provider);
      const balance = await tokenContract.balanceOf(tokenHold?.address);
      if(balance>0){
        const commentData = await commentModel.find({ projectId: token._id, replyTo: null });
        tokenData.push({
          ...token._doc,commentData,
          balance: balance.toString()
        })
      }
    }
    res.status(200).json({
      status: true,
      message: "Tokencoin fetched successfully",
      data: tokenData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching Tokencoins",
      error: error.message,
    });
  }
};
exports.getTokensForYou = async (req, res) => {
  const userId = req.user.userId;

  try {
    const coinsData = await commentModel.distinct('projectId');

    if (coinsData.length === 0) {
      return res.status(404).json({ status: false, message: "No Tokencoin found" });
    }


    // Filter out invalid ObjectId strings
const validIds = coinsData.filter(id => mongoose.Types.ObjectId.isValid(id));

// Convert to ObjectId
const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));



    // const tokenHold = await UserModel.findOne({ _id: userId });

    // const commentsUser = await commentModel.distinct('projectId');
    let tokenData = [];
    // for (const token of coinsData) {
    //   const tokenContract = await getContract(token.address, TOKEN_ABI, provider);
    //   const balance = await tokenContract.balanceOf(tokenHold?.address);

    //   // Only include tokens that the user holds
    //   if (balance > 0) {
    //     const commentData = await commentModel.find({ projectId: token._id, replyTo: null });
    //     tokenData.push({
    //       ...token._doc,
    //       commentData, 
    //       balance: balance.toString(),
    //     });
    //   }
    // }

    const _coinsData = await Tokencoin.find({ _id: {$in: objectIds} });

    if(_coinsData.length == 0 ){
     return res.status(200).json({
        status: true,
        message: "Tokencoin fetched successfully",
        data: [],
      });
    }
    let i = 0 ;
    //   let temp_project = [] ; 
    for (const comment of _coinsData) {
      
      
    //   if(temp_project.includes(comment.projectId)){
    //     return;
    //   }
    //   temp_project.push(comment.projectId);

      // const commentsUser = await commentModel.find({ userId: userId });
      const commentData = await commentModel.find({ projectId: comment._id });
      if(commentData.length == 0){
          return;
      }
      console.log(commentData[0].userId.toString() == userId)
      console.log(userId)
      if(commentData.length > 0){
        if(commentData[0].userId.toString() == userId){
        


    //   const commentsToken = await Tokencoin.findOne({ _id: comment.projectId });
   

    //   if (commentsToken) {
    //     // const tokenContract = await getContract(commentsToken.address, TOKEN_ABI, provider);
    //     // const commentTokenBalance = await tokenContract.balanceOf(tokenHold?.address);

        const userDate = await UserModel.findOne({ _id: comment.createdBy });

    //     // if (commentTokenBalance > 0) {
          tokenData.push({
            ...comment._doc,
            commentData: commentData,
            username: userDate.username
            // balance: commentTokenBalance.toString(),
          });
        }
      }

          if(i == (_coinsData.length - 1)){
            return  res.status(200).json({
              status: true,
              message: "Tokencoin fetched successfully",
              data: tokenData,
            });
          }
          i++ ; 
    //     // }
    //   }
    }

   
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching Tokencoins",
      error: error.message,
    });
  }
};


exports.getListed = async (req,res) => {
  try {
    const coinsData = await Tokencoin.find({status: 2});
    if (coinsData.length === 0) {
      return res.status(404).json({ status: false, message: "No Tokencoin found" });
    }
    // Fetch comments for each Tokencoin
    // const coinsWithComments = await Promise.all(
    //   coinsData.map(async (coin) => {
    //     const user = await UserModel.findOne({ _id: coin?.createdBy});
    //     const commentData = await commentModel.find({ projectId: coin._id,replyTo: null });
    //     return { ...coin._doc,username: user.username, commentData };
    //   })
    // );

    res.status(200).json({
      status: true,
      message: "Tokencoin fetched successfully",
      coinsData: coinsData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching Tokencoins",
      error: error.message,
    });
  }

}

exports.trackMarketValue = async () => {
  try {
    const data = await Tokencoin.find({ published: true });

    for (const token of data) {
      const projectId = token._id.toString();
      const REQUIRE_TOKEN_LIQUIIDTY = await contributeContract.REQUIRE_TOKEN_LIQUIIDTY();
      const project = await contributeContract.projects(projectId);
      const contribution  = project?.[6] ; 
      const _status  = project?.[4] ; 
      const _currentPrice  = contribution ? parseFloat(REQUIRE_TOKEN_LIQUIIDTY/contribution)  : 0;
     
      
      const tokenSold = await contributeContract.tokensSold(projectId);
      const INITIAL_SUPPLY = await contributeContract.INITIAL_SUPPLY();
      const getBNBPrice = await contributeContract.getBNBPrice();
      // console.log("_currentPrice",_currentPrice);
      // console.log("INITIAL_SUPPLY",formatEther(INITIAL_SUPPLY));
      // console.log("INITIAL_SUPPLY",formatEther(INITIAL_SUPPLY)/_currentPrice);        
      // const marketValue=parseFloat(formatEther(_buyPrice)*formatEther(tokenSold)).toFixed(6)

      
      const marketValue= _currentPrice == 0 ? 0 : parseFloat(formatEther(INITIAL_SUPPLY)/_currentPrice).toFixed(6) * (1/(formatEther(getBNBPrice)/1e12))
      // console.log("marketValue",marketValue);
 
      await Tokencoin.findByIdAndUpdate(projectId, {
        buyPrice:_currentPrice,
        sellPrice:_currentPrice,
        tokenSold:formatEther(tokenSold),
        marketValue:parseFloat((marketValue)),      
        status: parseInt(_status)
      });
    }
  } catch (error) {
    console.error('Error tracking market value:', error);
  }
};

