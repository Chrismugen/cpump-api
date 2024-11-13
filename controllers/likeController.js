const Like = require("../models/likeModel");

// POST: Create or update a like
exports.createLike = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { commentId, like } = req.body;

    if (like === undefined || !commentId) {
      return res
        .status(400)
        .json({
          status: false,
          message: "Like status and commentId are required",
        });
    }

    // Check if a like already exists for this user and comment
    const existingLike = await Like.findOne({
      userId: userId,
      commentId: commentId,
    });

    if (existingLike && existingLike.like === like) {
      await Like.deleteOne({ _id: existingLike._id });
      return res
        .status(200)
        .json({ status: true, message: "Like deleted successfully" });
    } else {
      const newLike = await Like.findOneAndUpdate(
        { userId, commentId },
        { like },
        { new: true, upsert: true }
      );
      return res
        .status(201)
        .json({
          status: true,
          message: "Like created successfully",
          data: newLike,
        });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        status: false,
        message: "Error creating or updating like",
        error: error.message,
      });
  }
};

// GET: Fetch all likes
exports.getLikes = async (req, res) => {
  try {
    const likes = await Like.find();

    if (likes.length === 0) {
      return res.status(404).json({ status: false, message: "No likes found" });
    }

    res
      .status(200)
      .json({
        status: true,
        message: "Likes fetched successfully",
        data: likes,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        status: false,
        message: "Error fetching likes",
        error: error.message,
      });
  }
};

// GET: Fetch likes by commentId
exports.getLikesByCommentId = async (req, res) => {
    try {
      const { commentId } = req.params;
  
      if (!commentId) {
        return res.status(400).json({ status: false, message: "commentId is required" });
      }
  
      const likes = await Like.find({ commentId });
  
      if (likes.length === 0) {
        return res.status(404).json({ status: false, message: "No likes found for this comment" });
      }
  
      // Separate likes and dislikes based on the value of the 'like' field
      const filteredLikes = {
        likes: likes.filter(like => like.like === true),
        dislikes: likes.filter(like => like.like === false),
      };
  
      res.status(200).json({
        status: true,
        message: "Likes fetched successfully",
        likes: filteredLikes.likes,
        dislikes: filteredLikes.dislikes,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        message: "Error fetching likes",
        error: error.message,
      });
    }
  };
  exports.getLikesByUserId = async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Find likes based on userId
      const likes = await Like.find({ userId });
  
      if (likes.length === 0) {
        return res.status(404).json({ status: false, message: "No likes found for this user" });
      }
  
      // Separate likes and dislikes based on the 'like' field
      const filteredLikes = {
        likes: likes.filter(like => like.like === true),
        dislikes: likes.filter(like => like.like === false),
      };
  
      // Get counts for likes and dislikes
      const likesCount = filteredLikes.likes.length;
      const dislikesCount = filteredLikes.dislikes.length;
  
      res.status(200).json({
        status: true,
        message: "Likes fetched successfully",
        likes: filteredLikes.likes,
        dislikes: filteredLikes.dislikes,
        likesCount: likesCount,
        dislikesCount: dislikesCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        message: "Error fetching likes",
        error: error.message,
      });
    }
  };
  
  
