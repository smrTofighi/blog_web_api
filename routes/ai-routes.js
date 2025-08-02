const exporess = require("express");
const router = exporess.Router();
const {protect} = require('../middlewares/auth-middleware')
const {generateBlogPost, generateBlogPostIdeas, generateCommentReply, generatePostSummary} = require('../controllers/ai-controller')

router.post('/generate', protect, generateBlogPost);
router.post('/generate-ideas', protect, generateBlogPostIdeas);
router.post('/generate-reply', protect, generateCommentReply);
router.post('/generate-summary', protect, generatePostSummary);

module.exports = router