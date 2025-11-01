/**
 * @file routes/teamRoutes.js
 * @description Routes for creating teams and managing membership.
 */

const express = require("express");
const { verifyToken } = require("../middlewares/auth");
const { verifyTeamAdmin } = require("../middlewares/teamAuth");
const requireTeamAdmin = require("../middlewares/requireTeamAdmin");
const { body } = require("express-validator");
const {
	createTeam,
	addMember,
	removeMember,
	getTeam,
	getUserTeams,
	deleteTeam,
	listTeams,
	changeAdmin,
	changeAccessLevel,
} = require("../controllers/teamController");

const router = express.Router();

/**
 * @route   POST /create
 * @desc    Create a new team in the user’s organization
 * @access  Private
 */
router.post(
	"/create",
	verifyToken,
	requireTeamAdmin,
	[body("name").notEmpty().withMessage("Team name is required!")],
	createTeam
);

/**
 * @route   GET /all
 * @desc    List all teams in your organization
 * @access  Private
 */
router.get("/all", verifyToken, listTeams);

/**
 * @route   PUT /:id/add-member
 * @desc    Add a member to a team (must be team_admin)
 * @access  Private
 */
router.put("/:id/add-member", verifyToken, verifyTeamAdmin, addMember);

/**
 * @route   PUT /:id/remove-member
 * @desc    Remove a member from a team (must be team_admin)
 * @access  Private
 */
router.put("/:id/remove-member", verifyToken, verifyTeamAdmin, removeMember);

/**
 * @route   GET /:id
 * @desc    Get details of a single team
 * @access  Private
 */
router.get("/:id", verifyToken, getTeam);

/**
 * @route   GET /
 * @desc    List all teams the authenticated user belongs to
 * @access  Private
 */
router.get("/", verifyToken, getUserTeams);

/**
 * @route   DELETE /:id
 * @desc    Delete a team (must be team_admin)
 * @access  Private
 */
router.delete("/:id", verifyToken, verifyTeamAdmin, deleteTeam);

router.patch("/:id/change-admin", verifyToken, verifyTeamAdmin, changeAdmin);

/**
 * @route   PATCH /:id/change-access
 * @desc    Change access level of a member (must be team_admin)
 * @access  Private
 */
router.patch(
	"/:id/change-access",
	verifyToken,
	verifyTeamAdmin,
	changeAccessLevel
);

module.exports = router;
