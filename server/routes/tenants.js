const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants (Owner only)
 * @access  Private (Owner)
 */
router.get('/', authenticate, authorize('Owner'), tenantController.getAllTenants);

/**
 * @route   GET /api/tenants/me
 * @desc    Get current user's tenant
 * @access  Private
 */
router.get('/me', authenticate, tenantController.getMyTenant);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get single tenant
 * @access  Private
 */
router.get('/:id', authenticate, tenantController.getTenant);

/**
 * @route   PUT /api/tenants/:id
 * @desc    Update tenant (Owner only)
 * @access  Private (Owner)
 */
router.put('/:id', authenticate, authorize('Owner'), tenantController.updateTenant);

module.exports = router;
