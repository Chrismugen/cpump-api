const express = require("express");
const auth= require("../middleware/auth")
const { createTokencoin, getTokencoin, getCoinById, deleteCoin, getHotpickscoin, getCrownToken, getCoinsByCreatedBy, getTokenHeld, getListed, getTokensForYou } = require("../controllers/tokenCoinController");
const { createUser, getAllUsers, getUserById, updateUser, getUserByaddress, getSingleUser } = require("../controllers/userController");
const { getComments, createComment, deleteComment, getCommentsByProjectId, getReplyCommentsByCommentId } = require("../controllers/commentController");
const { createLike, getLikes, getLikesByCommentId, getLikesByUserId } = require("../controllers/likeController");
const { getTradesByProjectId, getChartTradesByProjectId, getLatestTrades, verifyTokenContract } = require("../controllers/coinTrade");
const { followUser, unfollowUser, getFollowers, getFollowing, getFollowersByUserId, getFollowByUserIdAndFollowerId, getFollowingByUserId } = require("../controllers/followController");


const publicApiRoutes = express.Router();
// /TokenCoin
publicApiRoutes.post("/create/token-coin",auth, createTokencoin);
publicApiRoutes.get("/token-coins", getTokencoin);
publicApiRoutes.get("/listed/token-coins", getListed);
publicApiRoutes.get("/hotpicks/token-coins", getHotpickscoin);
publicApiRoutes.get("/get/crown", getCrownToken);
publicApiRoutes.get("/token/:createdBy", getCoinsByCreatedBy);
publicApiRoutes.get("/get/token/held/:id", getTokenHeld);
// publicApiRoutes.get("/get/token/for/you", auth,  getTokensForYou);
publicApiRoutes.get("/token-coin/:id", getCoinById);
// publicApiRoutes.delete("/token-coin/:id", deleteCoin);

// /user
publicApiRoutes.post("/create/user", createUser);
publicApiRoutes.get("/all/user", getAllUsers);
publicApiRoutes.get("/get/user/:address",getUserByaddress );
publicApiRoutes.get("/get/user",auth, getUserById);
publicApiRoutes.get("/get/single/user/:id", getSingleUser);
publicApiRoutes.put("/update/user",auth, updateUser);

// comments
publicApiRoutes.post("/create/comment",auth, createComment);
publicApiRoutes.get("/all/comment", getComments);
publicApiRoutes.get("/get/comments/:projectId", getCommentsByProjectId);
publicApiRoutes.get("/get/reply/:commentId", getReplyCommentsByCommentId);
publicApiRoutes.delete("/delete/comment/:id", deleteComment);

// like
publicApiRoutes.post("/create/like",auth, createLike);
publicApiRoutes.get("/all/likes", getLikes);
publicApiRoutes.get("/likes/comment/:commentId", getLikesByCommentId);
publicApiRoutes.get("/likes/by/userId",auth, getLikesByUserId);

//trades
publicApiRoutes.get("/get/trades/:projectId", getTradesByProjectId);
publicApiRoutes.get("/get/chart/trades/:projectId", getChartTradesByProjectId);
publicApiRoutes.get("/get/latest/trades", getLatestTrades);
publicApiRoutes.post("/verify/contract", verifyTokenContract);
// Follow 
publicApiRoutes.post("/follow", followUser);
publicApiRoutes.post("/unfollow", unfollowUser);
publicApiRoutes.get("/get/follow/:userId/:followerId", getFollowByUserIdAndFollowerId);
publicApiRoutes.get("/get/followers/:userId", getFollowers);
publicApiRoutes.get("/get/following/:id", getFollowing);
publicApiRoutes.get("/get/following/by/userId", auth,getFollowingByUserId);


module.exports = publicApiRoutes;
