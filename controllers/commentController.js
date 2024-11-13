const coinTrade = require('../models/coinTrade');
const commentModel = require('../models/commentModel');
const settings = require('../models/settings');
const tokenCoin = require('../models/tokenCoin');
const CONTRIBUTE_ABI = require('../utils/CONTRIBUTE_ABI');
const { ethers } = require("ethers");
const formidable = require("formidable");
const fs = require("fs");
const AWS = require("aws-sdk");
const { getCurrentPrice } = require('./tokenCoinController');

const s3Client = new AWS.S3({
  secretAccessKey: process.env.ACCESS_KEY,
  accessKeyId: process.env.ACCESS_ID,
  region: process.env.region,
});
console.log(process.env.DEFAULT_JOSN_RPC)
const provider = new ethers.JsonRpcProvider("https://rpc-core-cpump.icecreamswap.com");

const getContract = (contractAddress, contractAbi, signerOrProvider) => {
  const contract = new ethers.Contract(
    contractAddress,
    contractAbi,
    signerOrProvider,
  );
  return contract;
};

const contributeContractAddress = process.env.CONTRIBUTE_CONTRACT;
const contributeContract = getContract(contributeContractAddress, CONTRIBUTE_ABI, provider);

exports.createComment = async (req, res) => {
  const form = new formidable.IncomingForm({
    maxFileSize: 1 * 1024 * 1024 * 1024, // Max file size (1GB)
    multiples: true, // To handle multiple files if needed
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Error parsing form data -> " + err });
    }

    const { projectId, comment, replyTo } = fields;
    const userId = req.user.userId;

    if (!projectId || !userId || !comment) {
      return res.status(400).json({ status: false, message: 'Project ID, user ID, and comment are required' });
    }

    try {
      let imageUrl = null;

      // Check if an image was uploaded
      if (files.image) {
        const oldpath = files.image.filepath;
        const fileName = files.image.originalFilename;

        const buffer = fs.readFileSync(oldpath);

        const params = {
          Bucket: process.env.IMAGE_BUCKET, // S3 bucket name
          Key: fileName, // File name to store in S3
          Body: buffer, // File buffer
        };

        const s3data = await s3Client.upload(params).promise();
        imageUrl = s3data.Location; // URL of the uploaded image
      }

      // Create a new comment with image if uploaded
      const newComment = await commentModel.create({
        projectId,
        userId,
        comment,
        replyTo,
        image: imageUrl, // Set the image URL if available
      });

      res.status(201).json({ status: true, message: 'Comment created successfully', data: newComment });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Error creating comment', error: error.message });
    }
  });
};

exports.getComments = async (req, res) => {
  try {
    const comments = await commentModel.find();
    if (comments.length === 0) {
      return res.status(404).json({ status: false, message: 'No comments found' });
    }

    res.status(200).json({ status: true, message: 'Comments fetched successfully', data: comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Error fetching comments', error: error.message });
  }
};
exports.getCommentsByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ status: false, message: 'ProjectId is required' });
    }

    const comments = await commentModel.find({ projectId , replyTo: null }).populate('userId');


    if (comments.length === 0) {
      return res.status(200).json({ status: false, message: 'No comments found for this project' });
    }

    res.status(200).json({ status: true, message: 'Comments fetched successfully', data: comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Error fetching comments', error: error.message });
  }
};
exports.getReplyCommentsByCommentId = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!commentId) {
      return res.status(400).json({ status: false, message: 'CommentId is required' });
    }

    // Find reply comments with the given commentId in the replyTo field
    const replyComments = await commentModel.find({ replyTo: commentId }).populate('userId');

    if (replyComments.length === 0) {
      return res.status(404).json({ status: false, message: 'No reply comments found for this comment' });
    }

    res.status(200).json({ status: true, message: 'Reply comments fetched successfully', data: replyComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Error fetching reply comments', error: error.message });
  }
};
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await commentModel.findByIdAndDelete(id);

    if (!comment) {
      return res.status(404).json({ status: false, message: ' not found' });
    }

    res.status(200).json({ status: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Error deleting comment', error: error.message });
  }
};

let running = false
exports.trackDeposits = async () => {
  if (running) {
    return;
  }
  running = true;
  try {
    const getLatestBlock = await settings.findOne({ key: "blockNumber" });
    const start = getLatestBlock.value;
    const blockNumber = await provider.getBlockNumber();
    const diff = process.env.BLOCK_RANGE;
    const getBlockNumber = parseInt(start) + parseInt(diff);

    const endBlock =
      blockNumber > getBlockNumber ? getBlockNumber : blockNumber;

    let projectCreated = contributeContract.filters.ProjectCreated();
    // console.log(parseInt(start));
    // console.log(endBlock);
    // console.log(getBlockNumber);
    // console.log(blockNumber);
    const ProjectEvents = await contributeContract.queryFilter(
      projectCreated,
      parseInt(start),
      endBlock,
    );


    let buyProject = contributeContract.filters.ProjectContributed();

    const BuyEvents = await contributeContract.queryFilter(
      buyProject,
      parseInt(start),
      endBlock,
    );



    let sellProject = contributeContract.filters.ProjectSold();

    const SellEvents = await contributeContract.queryFilter(
      sellProject,
      parseInt(start),
      endBlock,
    );

    await settings.findOneAndUpdate(
      { key: "blockNumber" },
      { $set: { value: endBlock + 1 } },
      { new: true }
    );



    // Manage Project Status
    ProjectEvents.length > 0 && ProjectEvents.map(async (v, i) => {
      try {
        const _id = v.args[0]
        const token = v.args[2]
        await tokenCoin.findOneAndUpdate(
          { _id },
          { $set: { published: true, address: token } },
          { new: true }
        );

      }
      catch (e) {
        // console.log(e);
        running = false
      }
    })

    // Manage Project Buy
    BuyEvents.length > 0 && BuyEvents.map(async (v, i) => {
      try {

        const _id = v.args[0].toString()
        const user = v.args[1]
        const amount = parseInt(v.args[2]);
        const tokens = parseInt(v.args[3]);
        const openPrice = parseInt(v.args[5]);
        const closePrice = parseInt(v.args[6]);
        const timestamp = parseInt(v.args[4])
        await coinTrade.create(
          { project: _id, user, amount, tokens, timestamp, buy: true , openPrice: openPrice,closePrice: closePrice},
          
        );

      }
      catch (e) {
        console.log(e);
        running = false
      }
    })



    // Manage Project Sell
    SellEvents.length > 0 && SellEvents.map(async (v, i) => {
      try {
        const _id = v.args[0]
        const user = v.args[1]
        const amount = parseInt(v.args[2])
        const tokens = parseInt(v.args[3])
        const timestamp = parseInt(v.args[4])
        const openPrice = parseInt(v.args[5]);
        const closePrice = parseInt(v.args[6]);

        await coinTrade.create(
          { project: _id, user, amount, tokens, timestamp, buy: false, openPrice: openPrice,closePrice: closePrice },
          
        );

      }
      catch (e) {
        // console.log(e);
        running = false
      }
    })
 

    running = false


  }
  catch (e) {
    console.log(e);
    running = false
    console.log({ status: "NOT OK", message: "Internal Error." })
  }






}