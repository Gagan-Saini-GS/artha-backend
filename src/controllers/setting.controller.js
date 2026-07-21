import { prisma } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getSettingsByUserId = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const settings = await prisma.setting.findUnique({
    where: {
      user_id: userId,
    },
  });

  return res.status(200).json(new ApiResponse(200, settings));
});

const updateSettingsByUserId = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  // Send full setting object in API call.
  const { settings } = req.body;

  const updatedSettings = await prisma.setting.update({
    where: {
      user_id: userId,
    },
    data: {
      ...settings,
    },
  });

  if (!updatedSettings) {
    throw new ApiError(500, "Unable to update settings");
  }

  return res.status(200).json(new ApiResponse(200, updatedSettings));
});

export { getSettingsByUserId, updateSettingsByUserId };
