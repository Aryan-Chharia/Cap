/**
 * @file routes/organizationRoutes.js
 * @description Routes for organization signup, login, and management.
 */

const express = require("express");
const {
	createOrganization,
	loginOrganization,
	getOrganization,
	listOrganizations,
	updateOrganization,
	deleteOrganization,
	getAllMembers, 
	makeCreator,
} = require("../controllers/organizationController");
const { verifyToken } = require("../middlewares/auth");
const isOrgOwner = require("../middlewares/isOrgOwner");

const router = express.Router();

/**
 * @route   POST /register
 * @desc    Register a new organization
 * @access  Public
 */
router.post("/register", createOrganization);

/**
 * @route   POST /login
 * @desc    Log in as an organization
 * @access  Public
 */
router.post("/login", loginOrganization);

/**
 * @route   GET /:id
 * @desc    Get organization details (populates members)
 * @access  Private (Owner only)
 */
router.get("/:id", verifyToken, isOrgOwner, getOrganization);

/**
 * @route   GET /:orgId/members
 * @desc    List all members of an organization
 * @access  Private (Owner only)
 */
router.get("/:orgId/members", verifyToken, isOrgOwner, getAllMembers);

/**
 * @route   PUT /:orgId/members/:userId/admin
 * @desc    Promote a user to team_admin within the organization
 * @access  Private (Owner only)
 */
router.put(
	"/:orgId/members/:userId/admin",
	verifyToken,
	isOrgOwner,
	makeCreator
);

/**
 * @route   PUT /update/:id
 * @desc    Update organization details
 * @access  Private (Owner only)
 */
router.put("/update/:id", verifyToken, isOrgOwner, updateOrganization);

/**
 * @route   DELETE /delete/:id
 * @desc    Delete an organization
 * @access  Private (Owner only)
 */
router.delete("/delete/:id", verifyToken, isOrgOwner, deleteOrganization);

/**
 * @route   GET /
 * @desc    List all organizations
 * @access  Public (for testing, adjust as needed)
 */
router.get("/", listOrganizations);

module.exports = router;
