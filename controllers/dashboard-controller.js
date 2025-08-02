const BlogPost = require("../models/blog-post-model");
const Comment = require("../models/comment-model");

// @desc    Dashboard summary
// @route   POST /api/dashboard-summary
// @acess   Private (Admin-only)
const getDashboardSummary = async (req, res) => {
  try {
    // Basic counts
    const [totalPosts, drafts, published, totalComments, aiGenerated] =
      await Promise.all([
        BlogPost.countDocuments(),
        BlogPost.countDocuments({ isDraft: true }),
        BlogPost.countDocuments({ isDraft: false }),
        Comment.countDocuments(),
        Comment.countDocuments({ aiGenerated: true }),
      ]);
    const totalViewsAgg = await BlogPost.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    const totalLikesAgg = await BlogPost.aggregate([
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);

    const totalViews = totalViewsAgg[0]?.totalViews || 0;
    const totalLikes = totalLikesAgg[0]?.totalLikes || 0;

    // Top performing posts
    const topPosts = await BlogPost.find({ isDraft: false })
      .sort({ views: -1, likes: -1 })
      .limit(5);

    // Recent comments
    const recentComments = await Comment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("author", "name profileImageUrl")
      .populate("post", "title coverImageUrl");

    // Tag usage aggregation
    const tagUsage = await BlogPost.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      status: {
        totalPosts,
        drafts,
        published,
        totalComments,
        aiGenerated,
        totalViews,
        totalLikes,
      },
      topPosts,
      recentComments,
      tagUsage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get dashboard summary",
      error: error.message,
    });
  }
};

module.exports = { getDashboardSummary };
