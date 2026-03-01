const express = require('express');
const router = express.Router();
const membershipPlanController = require('../controllers/membershipPlanController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/membership-plans
 * @desc    Create membership plan (Owner only)
 * @access  Private (Owner)
 */
router.post('/', authenticate, authorize('Owner'), membershipPlanController.createPlan);

/**
 * @route   GET /api/membership-plans
 * @desc    Get all membership plans in tenant
 * @access  Private
 */
router.get('/', authenticate, membershipPlanController.getAllPlans);

/**
 * @route   GET /api/membership-plans/:id
 * @desc    Get single membership plan
 * @access  Private
 */
router.get('/:id', authenticate, membershipPlanController.getPlan);

/**
 * @route   PUT /api/membership-plans/:id
 * @desc    Update membership plan (Owner only)
 * @access  Private (Owner)
 */
router.put('/:id', authenticate, authorize('Owner'), membershipPlanController.updatePlan);

/**
 * @route   DELETE /api/membership-plans/:id
 * @desc    Delete membership plan (soft delete, Owner only)
 * @access  Private (Owner)
 */
router.delete('/:id', authenticate, authorize('Owner'), membershipPlanController.deletePlan);

module.exports = router;
