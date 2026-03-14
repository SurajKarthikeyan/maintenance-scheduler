const { getPool } = require("../../config/db");
const bcrypt = require("bcryptjs");

/**
 * Find a user by username — used during login
 */
async function getUserByUsername(username) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ?",
    [username]
  );
  return rows[0] || null;
}

/**
 * Get all users — admin only, excludes password hashes
 */
async function getAllUsers() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT user_id, username, role, created_at FROM users ORDER BY created_at ASC"
  );
  return rows;
}

/**
 * Create a new user — password is hashed before storing
 */
async function createUser(username, password, role = "technician") {
  const pool = getPool();
  const password_hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
    [username, password_hash, role]
  );
  const [rows] = await pool.query(
    "SELECT user_id, username, role, created_at FROM users WHERE user_id = ?",
    [result.insertId]
  );
  return rows[0];
}

/**
 * Delete a user by ID
 */
async function deleteUser(id) {
  const pool = getPool();
  const [result] = await pool.query(
    "DELETE FROM users WHERE user_id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Validate a plain text password against a stored hash
 */
async function validatePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

module.exports = {
  getUserByUsername,
  getAllUsers,
  createUser,
  deleteUser,
  validatePassword,
};