import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";

const createTransaction = asyncHandler(async (req, res) => {
  const { title, type, amount, date, note } = req.body;
  const userId = req.user.id;

  const transaction = await prisma.transaction.create({
    data: {
      title,
      type,
      amount,
      /**
       * Adding the 'Z' to make it a valid UTC timestamp for Prisma,
       * then it automatically converts it to the correct timezone,
       * well it not recommended using this 'Z' directly,
       * but if I change from frontend then it will be alot code changes
       */
      date: `${date}Z`,
      note,
      user_id: userId,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, transaction, "Transaction created successfully"),
    );
});

const getRecentTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const transactions = await prisma.transaction.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { date: "desc" },
    take: 5,
  });
  return res.status(200).json(new ApiResponse(200, transactions));
});

const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const transaction = await prisma.transaction.findFirst({
    where: { id, user_id: userId, deleted_at: null },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return res.status(200).json(new ApiResponse(200, transaction));
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  const userId = req.user.id;
  if (!date || isNaN(Date.parse(date))) {
    throw new ApiError(400, "Invalid date format");
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, user_id: userId },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  // Soft delete
  await prisma.transaction.update({
    where: { id },
    data: { deleted_at: `${date}Z` },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Transaction deleted successfully"));
});

const getTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  const transactions = await prisma.transaction.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { date: "desc" },
    skip,
    take: limit,
  });

  const totalTransactions = await prisma.transaction.count({
    where: { user_id: userId, deleted_at: null },
  });

  const totals = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      user_id: userId,
      deleted_at: null,
    },
    _sum: {
      amount: true,
    },
  });

  const totalPages = Math.ceil(totalTransactions / limit);

  const paginationData = {
    transactions,
    currentPage: page,
    totalPages,
    totalCount: totals,
  };

  return res.status(200).json(new ApiResponse(200, paginationData));
});

const getTransactionsByDateRange = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, type } = req.query;

  if (
    !startDate ||
    !endDate ||
    isNaN(Date.parse(startDate)) ||
    isNaN(Date.parse(endDate))
  ) {
    throw new ApiError(400, "Invalid or missing startDate / endDate");
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      date: {
        gte: new Date(`${startDate}Z`),
        lte: new Date(`${endDate}Z`),
      },
      ...(type && { type: type }),
    },
    orderBy: { date: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, transactions));
});

export {
  createTransaction,
  getRecentTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionHistory,
  getTransactionsByDateRange,
};
