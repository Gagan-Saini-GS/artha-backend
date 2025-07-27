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
      date: new Date(date),
      note,
      user_id: userId,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, transaction, "Transaction created successfully")
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
  const userId = req.user.id;

  const transaction = await prisma.transaction.findFirst({
    where: { id, user_id: userId },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  // Soft delete
  await prisma.transaction.update({
    where: { id },
    data: { deleted_at: new Date() },
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

  const totalPages = Math.ceil(totalTransactions / limit);

  const paginationData = {
    transactions,
    currentPage: page,
    totalPages,
    totalCount: totalTransactions,
  };

  return res.status(200).json(new ApiResponse(200, paginationData));
});

export {
  createTransaction,
  getRecentTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionHistory,
};
