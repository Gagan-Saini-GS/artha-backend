import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";

const getUserDetailsById = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      currency: true,
      created_at: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, user));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, avatar, currency } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      avatar,
      currency,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      currency: true,
      created_at: true,
    },
  });

  // If user is not found, throw an error
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, user));
});

export { updateUserDetails, getUserDetailsById };
