const commentModel = require('../models/commentModel');
const FollowModel = require('../models/followModel');
const tokenCoin = require('../models/tokenCoin');
const UserModel = require('../models/user');

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId, followerId } = req.body;

    if (userId === followerId) {
      return res.status(400).json({ status: false, message: "You cannot follow yourself" });
    }

    const existingFollow = await FollowModel.findOne({ userId, followerId });

    if (existingFollow) {
      return res.status(400).json({ status: false, message: "You are already following this user" });
    }

    const newFollow = new FollowModel({ userId, followerId });
    await newFollow.save();

    res.status(201).json({ status: true, message: "User followed successfully", data: newFollow });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId, followerId } = req.body;

    const follow = await FollowModel.findOneAndDelete({ userId, followerId });

    if (!follow) {
      return res.status(404).json({ status: false, message: "Follow relationship not found" });
    }

    res.status(200).json({ status: true, message: "User unfollowed successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};



exports.getFollowByUserIdAndFollowerId = async (req, res) => {
  try {
    const { userId, followerId } = req.params;

    // Find if the follow relationship exists
    const followRecord = await FollowModel.find({ userId, followerId });

    if (!followRecord) {
      return res.status(404).json({
        status: false,
        message: "Follow relationship not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Follow relationship fetched successfully",
      data: followRecord,
    });
  } catch (error) {
    console.error("Error fetching follow relationship:", error.message);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await FollowModel.find({userId});
    // Fetch user details for each follower
    // const followerDetails = await Promise.all(
    //   followers.map(async (follower) => {
    //     const user = await UserModel.findOne({ _id: follower.followerId });
        
        
    //     return { ...follower._doc, followerDetails: user };
    //   })
    // );

    res.status(200).json({ status: true, message: "Followers fetched successfully", data: followers });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

// Get users followed by a user
exports.getFollowing = async (req, res) => {
  try {
    const followerId = req.params.id;

    const following = await FollowModel.find({ followerId });

    // Fetch user details for each followed user
    // const followingDetails = await Promise.all(
    //   following.map(async (follow) => {
    //     const user = await UserModel.findOne({ _id: follow.userId });
    //     return { ...follow._doc, userDetails: user };
    //   })
    // );

    res.status(200).json({ status: true, message: "Following fetched successfully", data: following });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};
exports.getFollowingByUserId = async (req, res) => {
  try {
    const userId = req.user.userId;
    const following = await FollowModel.find({ followerId: userId });

    // const followingDetails = await Promise.all(
    //   following.map(async (follow) => {
    //     const coins = await tokenCoin.find({ createdBy: follow.userId });
    //     const user = await UserModel.findOne({ _id: follow.userId });
    //     const coinsWithComments = await Promise.all(
    //       coins.map(async (coin) => {
    //         const commentData = await commentModel.find({ projectId: coin._id, replyTo: null });
    //         return { ...coin._doc, username: user?.username, commentData };
    //       })
    //     );

    //     return { ...follow._doc, userDetails: user, coinsData: coinsWithComments };
    //   })
    // );

    res.status(200).json({
      status: true,
      message: "Following fetched successfully",
      data: following,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

