const express = require("express");
const router = express.Router()
const {protect} = require('../middlewares/auth-middleware')
const {
    addComment,
    getCommentsByPost,
    deleteComment,
    getAllComments,
} = require('../controllers/comment-controller')

router.post('/:postId', protect, addComment)
router.get('/:postId', getCommentsByPost)
router.delete('/:commentId', protect, deleteComment)
router.get('/', getAllComments)

module.exports = router