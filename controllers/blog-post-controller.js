const BlogPost = require("../models/blog-post-model");
const mongoose = require("mongoose");

// @desc Create a new blog post
// @route POST /api/posts
// @access Private (Admin only)
const createPost = async (req, res) => {
    try {
        const {title, content, coverImageUrl, tags, isDraft, generatedByAI} =
            req.body;
        const slug = title
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "");

        const newPost = new BlogPost({
            title,
            content,
            coverImageUrl,
            tags,
            slug,
            author: req.user._id, // Assuming req.user is populated with the logged-in user
            isDraft,
            generatedByAI,
        });

        await newPost.save();
        res.status(201).json({newPost});
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to create post", error: error.message});
    }
};

// @desc Update an existing blog post
// @route POST /api/posts/:id
// @access Private (Admin or Author only)
const updatePost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({message: 'Post not found'})
        if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({message: "Not authorized to update this post"})
        }
        const updateData = req.body;
        if (updateData.title) {
            updateData.slug = updateData.title.toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "");

        }
        const updatePost = await BlogPost.findByIdAndUpdate(
            req.params.id,
            updateData,
            {new: true}
        )
        res.json(updatePost);
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to update post", error: error.message});
    }
};

// @desc Delete a blog post
// @route DELETE /api/posts/:id
// @access Private (Admin or Author only)
const deletePost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({message: 'Post not found'})
        await post.deleteOne()
        res.json({message: 'Post deleted successfully'})
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to delete post", error: error.message});
    }
};

// @desc Get blog posts by status (All, Published, Draft) and include counts
// @route GET /api/posts?status=all|published|draft&page=1
// @access Public
const getAllPosts = async (req, res) => {
    try {

        const status = req.query.status || "published";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        // Determine filter for main posts response
        let filter = {};
        if (status === "published") filter.isDraft = false;
        if (status === "draft") filter.isDraft = true;

        // Fetch paginated posts
        const posts = await BlogPost.find(filter).populate("author", "name profileImageUrl").sort({updatedAt: -1}).skip(skip).limit(limit);
        console.log(posts)
        // Count totals for pagination and tab counts
        const [totalCount, allCount, publishedCount, draftCount] = await Promise.all(
            [
                BlogPost.countDocuments(filter), // for pagination of current tab
                BlogPost.countDocuments(),
                BlogPost.countDocuments({isDraft: false}),
                BlogPost.countDocuments({isDraft: true}),
            ]
        )
        res.status(200).json({
            posts,
            page,
            tatalPages: Math.ceil(totalCount / limit),
            totalCount,
            counts: {
                all: allCount,
                published: publishedCount,
                draft: draftCount
            }
        })
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to get all posts", error: error.message});
    }
};

// @desc Get a single blog post by slug
// @route GET /api/posts/:slug
// @access Public
const getPostBySlug = async (req, res) => {
    try {
        const post = await BlogPost.findOne({slug: req.params.slug}).populate("author", "name profileImageUrl");
        if (!post) return res.status(404).json({message: 'Post not found'})
        res.json(post);
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to get post by slug", error: error.message});
    }
};

// @desc Get posts by tag
// @route GET /api/posts/tag/:tag
// @access Public
const getPostsByTag = async (req, res) => {
    try {
        const posts = await BlogPost.find({tags: req.params.tag}).populate("author", "name profileImageUrl");

        res.json(posts);
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to get post by slug", error: error.message});
    }
};

// @desc Search posts by title or content
// @route GET /api/posts/search?q=keyword
// @access Public
const searchPosts = async (req, res) => {
    try {
        const q = req.query.q;
        const posts = await  BlogPost.find({
            isDraft: false,
            $or: [
                {title: {$regex: q, $options: "i"}},
                {content: {$regex: q, $options: "i"}}

            ]
        }).populate("author", "name profileImageUrl");
        res.json(posts);

    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to get post by slug", error: error.message});
    }
};

// @desc Increment post view count
// @route PUT /api/posts/:id/view
// @access Public
const incrementView = async (req, res) => {
    try {
        await BlogPost.findByIdAndUpdate(req.params.id, {$inc: {views: 1}});
        res.json({message: "View count incremented"});
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to get post by slug", error: error.message});
    }
};

// @desc Like a post
// @route PUT /api/posts/:id/like
// @access Public
const likePost = async (req, res) => {
    try {
        await BlogPost.findByIdAndUpdate(req.params.id, {$inc: {likes: 1}});
        res.json({message: "Like count incremented"});
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to get post by slug", error: error.message});
    }
};

// @desc Get all posts of logged-in user
// @route GET /api/posts/trending
// @access Private
const getTopPosts = async (req, res) => {
    try {
        // Top performing posts
        const posts = await BlogPost.find({isDraft:  false}).sort({views: -1, likes: -1}).limit(5)

        res.json(posts);
    } catch (error) {
        res
            .status(500)
            .json({message: "Failed to get post by slug", error: error.message});
    }
};

module.exports = {
    createPost,
    updatePost,
    deletePost,
    getAllPosts,
    getPostBySlug,
    getPostsByTag,
    searchPosts,
    incrementView,
    likePost,
    getTopPosts,
};
