const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// POST /api/auth/login — public, no auth required
router.post("/login", controller.login);

// GET /api/auth/me — requires valid token
router.get("/me", requireAuth, controller.me);

// GET /api/auth/users — admin only
router.get("/users", requireAuth, requireAdmin, controller.listUsers);

// POST /api/auth/register — admin only
router.post("/register", requireAuth, requireAdmin, controller.register);

// DELETE /api/auth/users/:id — admin only
router.delete("/users/:id", requireAuth, requireAdmin, controller.removeUser);

module.exports = router;