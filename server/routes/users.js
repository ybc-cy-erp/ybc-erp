const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/users
 * @desc    Create new user in tenant (Owner only)
 * @access  Private (Owner)
 */
router.post('/', authenticate, authorize('Owner'), userController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users in tenant
 * @access  Private
 */
router.get('/', authenticate, userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private
 */
router.get('/:id', authenticate, userController.getUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Owner only)
 * @access  Private (Owner)
 */
router.put('/:id', authenticate, authorize('Owner'), userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete, Owner only)
 * @access  Private (Owner)
 */
router.delete('/:id', authenticate, authorize('Owner'), userController.deleteUser);

module.exports = router;
