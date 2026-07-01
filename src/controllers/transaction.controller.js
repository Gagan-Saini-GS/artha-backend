import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";
import { RollupPeriod } from "@prisma/client";
import { periodConfig } from "../constants.js";

const createTransaction = asyncHandler(async (req, res) => {
  const { title, type, amount, date, note } = req.body;
  const userId = req.user.id;

  const transactionDateString = `${date}Z`;
  const transactionDate = new Date(transactionDateString);

  const result = await prisma.$transaction(async (trx) => {
    const transaction = await trx.transaction.create({
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
        date: transactionDateString,
        note,
        user_id: userId,
      },
    });

    // Update user wallet
    const deltaAmount = type == "Income" ? amount : -1 * amount;

    const updatedWallet = await trx.wallet.update({
      where: {
        user_id: userId,
      },
      data: {
        bank_balance: {
          increment: deltaAmount,
        },
      },
      select: {
        id: true,
        bank_balance: true,
        user_id: true,
      },
    });

    if (!updatedWallet) {
      throw new ApiError(500, "Unable to update user wallet");
    }

    // Update transaction rollups (3 row)
    // 1. Daily Row
    // 2. Monthly Row
    // 3. Yearly Row
    const rollUpResults = await Promise.all(
      [RollupPeriod.Daily, RollupPeriod.Monthly, RollupPeriod.Yearly].map(
        (period) => {
          const config = periodConfig[period];
          const periodKey = config.generateKey(transactionDate);
          const periodStart = config.getPeriodStart(transactionDate);

          return trx.transactionRollup.upsert({
            where: {
              user_id_transaction_type_period_type_period_key: {
                user_id: userId,
                transaction_type: type,
                period_type: period,
                period_key: periodKey,
              },
            },
            update: {
              total_amount: {
                increment: amount,
              },
              transactions_count: {
                increment: 1,
              },
              last_transaction_at: transactionDate,
            },
            create: {
              user_id: userId,
              transaction_type: type,
              period_key: periodKey,
              period_type: period,
              period_start: periodStart,
              total_amount: amount,
              transactions_count: 1,
              last_transaction_at: transactionDate,
            },
          });
        },
      ),
    );

    return {
      transaction,
      updatedWallet,
    };
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        transaction: {
          ...result.transaction,
          amount: Number(result.transaction.amount),
        },
        updatedWallet: {
          ...result.updatedWallet,
          bank_balance: Number(result.updatedWallet.bank_balance),
        },
      },
      "Transaction created and wallet updated successfully",
    ),
  );
});

const getRecentTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const transactions = await prisma.transaction.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { date: "desc" },
    take: 5,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      transactions.map((trx) => ({
        ...trx,
        amount: Number(trx.amount),
      })),
    ),
  );
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

  return res.status(200).json(
    new ApiResponse(200, {
      ...transaction,
      amount: Number(transaction.amount),
    }),
  );
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
    data: { deleted_at: transactionDateString },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Transaction deleted successfully"));
});

const getTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const transactions = await prisma.transaction.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { date: "desc" },
    skip,
    take: limit + 1,
    select: {
      id: true,
      title: true,
      amount: true,
      type: true,
      date: true,
    },
  });

  const hasMore = transactions.length > limit;
  const finalTransactions = hasMore
    ? transactions.slice(0, limit)
    : transactions;

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

  const totalAggregate = totals.reduce(
    (acc, item) => {
      acc[item.type.toLowerCase()] = item._sum.amount ?? 0;
      return acc;
    },
    {
      expense: 0,
      income: 0,
      saving: 0,
    },
  );

  const response = {
    transactions: finalTransactions.map((trx) => ({
      ...trx,
      amount: Number(trx.amount),
    })),
    totalAggregates: {
      expense: Number(totalAggregate.expense),
      income: Number(totalAggregate.income),
      saving: Number(totalAggregate.saving),
    },
    pagination: {
      currentPage: page,
      hasMore: hasMore,
    },
  };

  return res.status(200).json(new ApiResponse(200, response));
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

  return res.status(200).json(
    new ApiResponse(
      200,
      transactions.map((trx) => ({
        ...trx,
        amount: Number(trx.amount),
      })),
    ),
  );
});

export {
  createTransaction,
  getRecentTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionHistory,
  getTransactionsByDateRange,
};
