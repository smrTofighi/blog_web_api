const express = require('express');
const router = express.Router();
const {protect} =require('../middlewares/auth-middleware')
const { getDashboardSummary} = require('../controllers/dashboard-controller')

// Admin-only middleware
const adminOnly = (req, res , next)=>{
    if(req.user && (req.user.role === 1 || req.user.role === 2)){
        next();
    }else{
        res.status(403).json({message:"Access denied. Admins only."});
    }
}

router.get('/', protect , adminOnly, getDashboardSummary);

module.exports = router;