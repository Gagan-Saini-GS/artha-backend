import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyRefreshToken,
} from "../utils/security.js";
import { prisma } from "../db/index.js";
// import { JWT_REFRESH_EXPIRY } from '../constants.js';

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, currency } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, currency },
    select: {
      id: true,
      name: true,
      email: true,
      currency: true,
      created_at: true,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken, refreshTokenExpiry } =
    await generateTokens(user.id);

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      user_id: user.id,
      expiry_at: new Date(refreshTokenExpiry),
    },
  });

  const loggedInUser = { id: user.id, name: user.name, email: user.email };
  const data = { user: loggedInUser, accessToken, refreshToken };

  return res.status(200).json(new ApiResponse(200, data, "Login successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token is required");

  const decoded = await verifyRefreshToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiry_at < new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const { accessToken } = await generateTokens(decoded.id, false);

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token is required");

  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
});

export { signup, login, refreshAccessToken, logout };
