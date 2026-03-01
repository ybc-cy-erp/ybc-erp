const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const freezeController = require('../controllers/freezeController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/memberships
 * @desc    Create membership
 * @access  Private (Owner, Manager)
 */
router.post('/', authenticate, authorize('Owner', 'Manager'), membershipController.createMembership);

/**
 * @route   GET /api/memberships
 * @desc    Get all memberships with filters
 * @access  Private
 */
router.get('/', authenticate, membershipController.getAllMemberships);

/**
 * @route   GET /api/memberships/:id
 * @desc    Get single membership with revenue calculation
 * @access  Private
 */
router.get('/:id', authenticate, membershipController.getMembership);

/**
 * @route   GET /api/memberships/:id/revenue
 * @desc    Get revenue breakdown for membership
 * @access  Private
 */
router.get('/:id/revenue', authenticate, membershipController.getMembershipRevenue);

/**
 * @route   PUT /api/memberships/:id
 * @desc    Update membership
 * @access  Private (Owner, Manager)
 */
router.put('/:id', authenticate, authorize('Owner', 'Manager'), membershipController.updateMembership);

/**
 * @route   DELETE /api/memberships/:id
 * @desc    Cancel membership (soft delete)
 * @access  Private (Owner, Manager)
 */
router.delete('/:id', authenticate, authorize('Owner', 'Manager'), membershipController.cancelMembership);

/**
 * Freeze management routes
 */

/**
 * @route   POST /api/memberships/:membership_id/freeze
 * @desc    Create freeze period for membership
 * @access  Private (Owner, Manager)
 */
router.post('/:membership_id/freeze', authenticate, authorize('Owner', 'Manager'), freezeController.createFreeze);

/**
 * @route   GET /api/memberships/:membership_id/freeze
 * @desc    Get all freeze periods for membership
 * @access  Private
 */
router.get('/:membership_id/freeze', authenticate, freezeController.getFreezes);

/**
 * @route   DELETE /api/membership-freeze/:freeze_id
 * @desc    Remove freeze period
 * @access  Private (Owner, Manager)
 */
router.delete('/:freeze_id/unfreeze', authenticate, authorize('Owner', 'Manager'), freezeController.removeFreeze);

module.exports = router;
