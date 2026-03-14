const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_production";
const JWT_EXPIRES = "8h";

/**
 * POST /api/auth/login
 * Validates credentials and returns a JWT token
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required" });
    }

    const user = await User.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const valid = await User.validatePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Sign JWT with user id, username and role
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      token,
      user: { user_id: user.user_id, username: user.username, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/users
 * Admin only — list all users
 */
async function listUsers(req, res, next) {
  try {
    const users = await User.getAllUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/register
 * Admin only — create a new user
 */
async function register(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required" });
    }

    const existing = await User.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ success: false, error: "Username already exists" });
    }

    const user = await User.createUser(username, password, role || "technician");
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/auth/users/:id
 * Admin only — remove a user
 */
async function removeUser(req, res, next) {
  try {
    // Prevent admin from deleting themselves
    if (parseInt(req.params.id) === req.user.user_id) {
      return res.status(400).json({ success: false, error: "You cannot delete your own account" });
    }
    const deleted = await User.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, message: "User removed" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the current logged in user's info from the token
 */
async function me(req, res) {
  res.json({ success: true, data: req.user });
}

module.exports = { login, listUsers, register, removeUser, me };