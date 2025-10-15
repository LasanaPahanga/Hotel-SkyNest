const express = require('express');
const router = express.Router();
const {
    getAllBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch
} = require('../controllers/branchController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.get('/', getAllBranches);
router.get('/:id', getBranch);

// Protected routes (Admin only)
router.use(verifyToken);
router.use(checkRole('Admin'));

router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

module.exports = router;
