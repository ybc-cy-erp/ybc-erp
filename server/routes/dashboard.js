const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get dashboard metrics (active members, MRR, expiring, etc.)
 * @access  Private
 */
router.get('/metrics', authenticate, dashboardController.getMetrics);

module.exports = router;
