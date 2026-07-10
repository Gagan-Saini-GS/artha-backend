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
    let lifetimeValues = {};
    if (type == "Income") {
      lifetimeValues = { income: { increment: amount } };
    } else if (type == "Expense") {
      lifetimeValues = { expense: { increment: amount } };
    } else if (type == "Saving") {
      lifetimeValues = { saving: { increment: amount } };
    }

    const updatedWallet = await trx.wallet.update({
      where: {
        user_id: userId,
      },
      data: {
        bank_balance: {
          increment: deltaAmount,
        },
        ...lifetimeValues,
      },
      select: {
        id: true,
        bank_balance: true,
        income: true,
        expense: true,
        saving: true,
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
          expense: Number(result.updatedWallet.expense),
          income: Number(result.updatedWallet.income),
          saving: Number(result.updatedWallet.saving),
        },
      },
      "Transaction created and wallet updated successfully",
    ),
  );
});

const createTransaction2 = asyncHandler(async (req, res) => {
  const { title, type, amount, date, note } = req.body;
  const userId = req.user.id;

  const transactionDateString = `${date}Z`;
  const transactionDate = new Date(transactionDateString);

  const result = await prisma.$transaction(async (trx) => {
    // Check for available balance first, before creating an expense transaction
    // if balance < trx amount then return error
    const wallet = await trx.wallet.findFirst({
      where: {
        user_id: userId,
      },
      select: {
        bank_balance: true,
        cash_balance: true,
        credit_due: true,
      },
    });

    if (type !== "Income" && wallet.bank_balance < amount) {
      throw new ApiError(400, "Insufficient balance", [
        "User does not have enough balance for this transaction.",
      ]);
    }

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
    let lifetimeValues = {};
    if (type == "Income") {
      lifetimeValues = { income: { increment: amount } };
    } else if (type == "Expense") {
      lifetimeValues = { expense: { increment: amount } };
    } else if (type == "Saving") {
      lifetimeValues = { saving: { increment: amount } };
    }

    const updatedWallet = await trx.wallet.update({
      where: {
        user_id: userId,
      },
      data: {
        bank_balance: {
          increment: deltaAmount,
        },
        ...lifetimeValues,
      },
      select: {
        id: true,
        bank_balance: true,
        income: true,
        expense: true,
        saving: true,
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
          expense: Number(result.updatedWallet.expense),
          income: Number(result.updatedWallet.income),
          saving: Number(result.updatedWallet.saving),
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

  const result = await prisma.$transaction(async (trx) => {
    const transactionDateString = `${date}Z`;

    // Find Transaction to delete
    const transaction = await trx.transaction.findFirst({
      where: { id, user_id: userId },
    });

    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    // Soft delete (Matching user_id for safety)
    await trx.transaction.update({
      where: { id, user_id: userId },
      data: { deleted_at: transactionDateString },
    });

    // Update User Wallet -> After transaction delete
    const type = transaction.type;
    const amount = transaction.amount;
    const transactionDate = transaction.date;

    const deltaAmount = type == "Income" ? -1 * amount : amount;
    let lifetimeValues = {};
    if (type == "Income") {
      lifetimeValues = { income: { increment: -1 * amount } };
    } else if (type == "Expense") {
      lifetimeValues = { expense: { increment: -1 * amount } };
    } else if (type == "Saving") {
      lifetimeValues = { saving: { increment: -1 * amount } };
    }

    const updatedWallet = await trx.wallet.update({
      where: {
        user_id: userId,
      },
      data: {
        bank_balance: {
          increment: deltaAmount,
        },
        ...lifetimeValues,
      },
      select: {
        id: true,
        bank_balance: true,
        income: true,
        expense: true,
        saving: true,
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

          return trx.transactionRollup.update({
            where: {
              user_id_transaction_type_period_type_period_key: {
                user_id: userId,
                transaction_type: type,
                period_type: period,
                period_key: periodKey,
              },
            },
            data: {
              total_amount: {
                increment: -1 * amount,
              },
              transactions_count: {
                increment: -1,
              },
            },
          });
        },
      ),
    );

    return {
      updatedWallet,
      rollUpResults,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        rollUpResults: result.rollUpResults.map((item) => ({
          ...item,
          total_amount: Number(item.total_amount),
        })),
        updatedWallet: {
          ...result.updatedWallet,
          bank_balance: Number(result.updatedWallet.bank_balance),
          expense: Number(result.updatedWallet.expense),
          income: Number(result.updatedWallet.income),
          saving: Number(result.updatedWallet.saving),
        },
      },
      "Transaction deleted successfully",
    ),
  );
});

const getTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
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

  const response = {
    transactions: finalTransactions.map((trx) => ({
      ...trx,
      amount: Number(trx.amount),
    })),
    pagination: {
      currentPage: page,
      hasMore: hasMore,
    },
  };

  return res.status(200).json(new ApiResponse(200, response));
});

const getTransactionsByDateRange = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, type, page, limit } = req.query;

  if (
    !startDate ||
    !endDate ||
    isNaN(Date.parse(startDate)) ||
    isNaN(Date.parse(endDate))
  ) {
    throw new ApiError(400, "Invalid or missing startDate / endDate");
  }

  const currentPage = parseInt(page) || 1;
  const currentLimit = parseInt(limit) || 15;
  const skip = (currentPage - 1) * currentLimit;

  const updatedEndDate = new Date(endDate);
  updatedEndDate.setDate(updatedEndDate.getDate() + 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      date: {
        gte: new Date(startDate),
        lte: updatedEndDate,
      },
      type: type,
    },
    skip: skip,
    take: currentLimit + 1,
    orderBy: { date: "desc" },
  });

  const hasMore = transactions.length > currentLimit;

  const response = {
    transactions: transactions.map((trx) => ({
      ...trx,
      amount: Number(trx.amount),
    })),
    pagination: {
      currentPage: currentPage,
      hasMore: hasMore,
    },
  };

  return res.status(200).json(new ApiResponse(200, response));
});

const searchTransaction = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, amount, page, limit } = req.query;

    if (name == null && amount == null) {
      throw "Name and Amount both can't be null";
    }

    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 15;
    const skip = (currentPage - 1) * currentLimit;

    const amountNumber = parseFloat(amount);

    const searchCondition =
      name != null && amount != null
        ? {
            AND: [
              { title: { contains: name, mode: "insensitive" } },
              { amount: { equals: amountNumber } },
            ],
          }
        : {
            OR: [
              ...(name != null
                ? [{ title: { contains: name, mode: "insensitive" } }]
                : []),
              ...(amount != null && !isNaN(amountNumber)
                ? [{ amount: { equals: amountNumber } }]
                : []),
            ],
          };

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        ...searchCondition,
      },
      skip: skip,
      take: currentLimit + 1,
      orderBy: { date: "desc" },
    });

    const hasMore = transactions.length > currentLimit;

    const response = {
      transactions: transactions.map((trx) => ({
        ...trx,
        amount: Number(trx.amount),
      })),
      pagination: {
        currentPage: currentPage,
        hasMore: hasMore,
      },
    };

    return res.status(200).json(new ApiResponse(200, response));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiError(500, "Error Searching Transaction", [error]));
  }
});

export {
  createTransaction,
  createTransaction2,
  getRecentTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionHistory,
  getTransactionsByDateRange,
  searchTransaction,
};
