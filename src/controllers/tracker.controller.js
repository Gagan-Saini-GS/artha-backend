import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";

const serializeTracker = (tracker) => ({
  ...tracker,
  current_amount: Number(tracker.current_amount),
  budget_amount: Number(tracker.budget_amount),
});

const createTracker = asyncHandler(async (req, res) => {
  const { name, budget_amount, current_amount, description } = req.body;
  const userId = req.user.id;

  const existing = await prisma.tracker.findUnique({
    where: {
      name_user_id: {
        name,
        user_id: userId,
      },
    },
  });

  if (existing) {
    throw new ApiError(409, "Tracker with this name already exists");
  }

  const tracker = await prisma.tracker.create({
    data: {
      name,
      budget_amount,
      current_amount: current_amount ?? 0,
      description,
      user_id: userId,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        serializeTracker(tracker),
        "Tracker created successfully",
      ),
    );
});

const getTrackers = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const trackers = await prisma.tracker.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    skip,
    take: limit + 1,
  });

  const hasMore = trackers.length > limit;
  const finalTrackers = hasMore ? trackers.slice(0, limit) : trackers;

  const response = {
    trackers: finalTrackers.map(serializeTracker),
    pagination: {
      currentPage: page,
      hasMore,
    },
  };

  return res.status(200).json(new ApiResponse(200, response));
});

const searchTrackers = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, amount, page, limit } = req.query;

  if (name == null && amount == null) {
    throw new ApiError(400, "Name and Amount both can't be null");
  }

  const currentPage = parseInt(page) || 1;
  const currentLimit = parseInt(limit) || 15;
  const skip = (currentPage - 1) * currentLimit;

  const amountNumber = parseFloat(amount);

  const searchCondition =
    name != null && amount != null && !isNaN(amountNumber)
      ? {
          AND: [
            { name: { contains: name, mode: "insensitive" } },
            { budget_amount: { equals: amountNumber } },
          ],
        }
      : {
          OR: [
            ...(name != null
              ? [{ name: { contains: name, mode: "insensitive" } }]
              : []),
            ...(amount != null && !isNaN(amountNumber)
              ? [{ budget_amount: { equals: amountNumber } }]
              : []),
          ],
        };

  const trackers = await prisma.tracker.findMany({
    where: {
      user_id: userId,
      ...searchCondition,
    },
    skip,
    take: currentLimit + 1,
    orderBy: { created_at: "desc" },
  });

  const hasMore = trackers.length > currentLimit;
  const finalTrackers = hasMore ? trackers.slice(0, currentLimit) : trackers;

  const response = {
    trackers: finalTrackers.map(serializeTracker),
    pagination: {
      currentPage,
      hasMore,
    },
  };

  return res.status(200).json(new ApiResponse(200, response));
});

const getTrackerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const tracker = await prisma.tracker.findFirst({
    where: { id, user_id: userId },
  });

  if (!tracker) {
    throw new ApiError(404, "Tracker not found");
  }

  return res.status(200).json(new ApiResponse(200, serializeTracker(tracker)));
});

const deleteTracker = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const tracker = await prisma.tracker.findFirst({
    where: { id, user_id: userId },
  });

  if (!tracker) {
    throw new ApiError(404, "Tracker not found");
  }

  await prisma.tracker.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { id }, "Tracker deleted successfully"));
});

export {
  createTracker,
  getTrackers,
  searchTrackers,
  getTrackerById,
  deleteTracker,
};
