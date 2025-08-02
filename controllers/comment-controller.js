const BlogPost = require('../models/blog-post-model')
const Comment = require('../models/comment-model')


// @desc Add a comment to a blog post
// @route POST /api/comments/:postId
// @access Private
const addComment = async (req, res) => {
    try {
        const {postId} = req.params;
        const {content, parentComment} = req.body;

        // Ensure blog post exists
        const post = await BlogPost.findById(postId);
        if (!post) {
            return res.status(404).json({message: 'Blog post not found'});
        }

        const comment = await Comment.create({
            post: postId,
            author: req.user._id,
            content,
            parentComment: parentComment || null
        })
        await comment.populate("author", "name profileImageUrl");
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({message: "Failed to add comment", error: error.message})
    }
}

// @desc Get all Comments
// @route GET /api/comments
// @access Public
const getAllComments = async (req, res) => {
    try {
        // Fetch all comments with author info
        const comments = await Comment.find().populate("author", "name profileImageUrl").populate("post", "title coverImageUrl").sort({createdAt: 1});

        // Create a map for commentId -> comment object
        const commentMap = {};
        comments.forEach(comment => {
            comment = comment.toObject();
            comment.replies = [];
            commentMap[comment._id] = comment;
        });

        // Nest replies under their parent comments
        const nestedComments = []
        comments.forEach(comment => {
            if (comment.parentComment) {
                const parent = commentMap[comment.parentComment];
                if (parent) {
                    parent.replies.push(commentMap[comment._id]);
                }
            } else {
                nestedComments.push(commentMap[comment._id]);
            }
        });
        res.json(nestedComments);
    } catch (error) {
        res.status(500).json({message: "Failed to get all comment", error: error.message})
    }
}

// @desc Get all Comments for a blog post
// @route GET /api/comments/:postId
// @access Public
const getCommentsByPost = async (req, res) => {
    try {
        const {postId} = req.params;
        const comments = await Comment.find({post: postId}).populate("author", "name profileImageUrl").populate("post", "title coverImageUrl").sort({createdAt: 1});
        // Create a map for commentId -> comment object
        const commentMap = {};
        comments.forEach(comment => {
            comment = comment.toObject();
            comment.replies = [];
            commentMap[comment._id] = comment;
        });

        // Nest replies under their parent comments
        const nestedComments = []
        comments.forEach(comment => {
            if (comment.parentComment) {
                const parent = commentMap[comment.parentComment];
                if (parent) {
                    parent.replies.push(commentMap[comment._id]);
                }
            } else {
                nestedComments.push(commentMap[comment._id]);
            }
        });
        res.json(nestedComments)
    } catch (error) {
        res.status(500).json({message: "Failed to get all comment by post", error: error.message})
    }
}

// @desc Delete a comment and its replies (author or admin only)
// @route DELETE /api/comments/:commentId
// @access Private
const deleteComment = async (req, res) => {
    try {
        const {commentId} = req.params;
        const comment = await Comment.findById(commentId)
        if (!comment) {
            return res.status(404).json({message: "Comment not found"})

        }
        // Delete the comment
        await Comment.deleteOne({_id: commentId})


        // Delete all replies to this comment (on level nesteding only)
        await Comment.deleteMany({parentComment: commentId});

        res.json({message: "Comment and any replies deleted successfully"})
    } catch (error) {
        res.status(500).json({message: "Failed to delete the comment", error: error.message})
    }
}

module.exports = {addComment, getCommentsByPost, deleteComment, getAllComments}