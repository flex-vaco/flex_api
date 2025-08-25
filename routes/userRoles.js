const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const UserRole = require('../models/UserRole.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

// Get all user roles
router.get("/", verifyToken, UserRole.findAll);

// Get user role by ID
router.get("/:id", verifyToken, UserRole.findById);

// Get user roles by line of business
router.get("/lineOfBusiness/:lineOfBusinessId", verifyToken, UserRole.findByLineOfBusiness);

// Create new user role
router.post("/", verifyToken, UserRole.create);

// Update user role
router.put("/:id", verifyToken, UserRole.update);

// Delete user role
router.delete("/:id", verifyToken, UserRole.erase);

module.exports = router;
