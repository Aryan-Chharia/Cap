/**
 * @file middleware/verifyTeamAdmin.js
 * @description Middleware to ensure the user is team_admin of the specified team.
 */

const Team = require("../models/teamSchema");

/**
 * Verify that the requester is a team_admin of the specified team.
 */
const verifyTeamAdmin = async (req, res, next) => {
	try {
		const { id } = req.params;
		const team = await Team.findById(id);
		if (!team) {
			return res.status(404).json({ error: "Team not found!" });
		}

		const requestingUser = team.members.find(
			(member) => member.user.toString() === req.user.userId.toString()
		);

		if (!requestingUser || requestingUser.role !== "team_admin") {
			return res
				.status(403)
				.json({ error: "Only team admins can perform this action!" });
		}

		req.team = team;
		next();
	} catch (error) {
		console.error("Authorization Error:", error);
		res.status(500).json({ error: "Server error!" });
	}
};

const verifyTeamAdminForProject = async (req, res, next) => {
	try {
		const project = req.project;
		if (!project) return res.status(400).json({ error: "Project not loaded!" });

		const team = await Team.findById(project.team);
		if (!team) return res.status(404).json({ error: "Team not found!" });

		const requestingUser = team.members.find(
			(member) => member.user.toString() === req.user.userId.toString()
		);

		if (!requestingUser || requestingUser.role !== "team_admin") {
			return res
				.status(403)
				.json({ error: "Only team admins can perform this action!" });
		}

		req.team = team;
		next();
	} catch (err) {
		console.error("Authorization Error:", err);
		res.status(500).json({ error: "Server error!" });
	}
};

module.exports = {
	verifyTeamAdmin,
	verifyTeamAdminForProject,
};
