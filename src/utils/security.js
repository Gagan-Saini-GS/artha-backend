import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from "../constants.js";

/**
 * Hashes a password using bcrypt.
 * @param {string} password The plain text password.
 * @returns {Promise<string>} The hashed password.
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Verifies a password against a hash.
 * @param {string} plainPassword The plain text password.
 * @param {string} hashedPassword The hashed password from the database.
 * @returns {Promise<boolean>} True if the password matches.
 */
export const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generates JWT access and refresh tokens.
 * @param {string} userId The user's ID to embed in the tokens.
 * @param {boolean} createRefreshToken Whether to create a new refresh token.
 * @returns {Promise<object>} An object containing the tokens and refresh token expiry.
 */
export const generateTokens = async (userId, createRefreshToken = true) => {
  const payload = { id: userId };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
  });

  if (!createRefreshToken) {
    return { accessToken };
  }

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });

  const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  return { accessToken, refreshToken, refreshTokenExpiry };
};

/**
 * Verifies a refresh token.
 * @param {string} token The refresh token.
 * @returns {Promise<object>} The decoded token payload.
 */
export const verifyRefreshToken = async (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
