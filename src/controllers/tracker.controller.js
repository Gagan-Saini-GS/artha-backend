import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";
import { RollupPeriod } from "@prisma/client";
import { periodConfig } from "../constants.js";

const serializeTracker = (tracker) => ({
  ...tracker,
  current_amount: Number(tracker.current_amount),
  budget_amount: Number(tracker.budget_amount),
});

const serializeWallet = (wallet) => ({
  ...wallet,
  bank_balance: Number(wallet.bank_balance),
  expense: Number(wallet.expense),
  income: Number(wallet.income),
  saving: Number(wallet.saving),
});

const createTracker = asyncHandler(async (req, res) => {
  const { name, budget_amount, current_amount, description } = req.body;
  const userId = req.user.id;
  const initialAmount = Number(current_amount ?? 0);

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

  const result = await prisma.$transaction(async (trx) => {
    if (initialAmount > 0) {
      const wallet = await trx.wallet.findFirst({
        where: { user_id: userId },
        select: { bank_balance: true },
      });

      if (!wallet || wallet.bank_balance < initialAmount) {
        throw new ApiError(400, "Insufficient balance", [
          "User does not have enough balance for this initial amount.",
        ]);
      }
    }

    const tracker = await trx.tracker.create({
      data: {
        name,
        budget_amount,
        current_amount: initialAmount,
        description,
        user_id: userId,
      },
    });

    if (initialAmount <= 0) {
      return { tracker, updatedWallet: null };
    }

    // Record the initial spent amount as an Expense transaction tied to this tracker,
    // and reflect it on the wallet + rollups (same flow as add-transaction v1).
    const transactionDate = new Date();
    const transactionDateString = transactionDate.toISOString();

    await trx.transaction.create({
      data: {
        title: name,
        type: "Expense",
        amount: initialAmount,
        date: transactionDateString,
        user_id: userId,
        tracker_id: tracker.id,
      },
    });

    const updatedWallet = await trx.wallet.update({
      where: { user_id: userId },
      data: {
        bank_balance: { increment: -1 * initialAmount },
        expense: { increment: initialAmount },
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

    await Promise.all(
      [RollupPeriod.Daily, RollupPeriod.Monthly, RollupPeriod.Yearly].map(
        (period) => {
          const config = periodConfig[period];
          const periodKey = config.generateKey(transactionDate);
          const periodStart = config.getPeriodStart(transactionDate);

          return trx.transactionRollup.upsert({
            where: {
              user_id_transaction_type_period_type_period_key: {
                user_id: userId,
                transaction_type: "Expense",
                period_type: period,
                period_key: periodKey,
              },
            },
            update: {
              total_amount: { increment: initialAmount },
              transactions_count: { increment: 1 },
              last_transaction_at: transactionDate,
            },
            create: {
              user_id: userId,
              transaction_type: "Expense",
              period_key: periodKey,
              period_type: period,
              period_start: periodStart,
              total_amount: initialAmount,
              transactions_count: 1,
              last_transaction_at: transactionDate,
            },
          });
        },
      ),
    );

    return { tracker, updatedWallet };
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        tracker: serializeTracker(result.tracker),
        updatedWallet: result.updatedWallet
          ? serializeWallet(result.updatedWallet)
          : null,
      },
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

  const result = await prisma.$transaction(async (trx) => {
    const tracker = await trx.tracker.findFirst({
      where: { id, user_id: userId },
    });

    if (!tracker) {
      throw new ApiError(404, "Tracker not found");
    }

    // Only active (non-deleted) transactions need wallet + rollup reversal.
    // Already-soft-deleted ones were reversed at their own delete time.
    const activeTransactions = await trx.transaction.findMany({
      where: { tracker_id: id, user_id: userId, deleted_at: null },
    });

    // Reverse rollups per transaction (mirrors deleteTransaction).
    if (activeTransactions.length > 0) {
      await Promise.all(
        activeTransactions.flatMap((t) => {
          const amount = Number(t.amount);
          return [
            RollupPeriod.Daily,
            RollupPeriod.Monthly,
            RollupPeriod.Yearly,
          ].map((period) => {
            const config = periodConfig[period];
            const periodKey = config.generateKey(t.date);
            return trx.transactionRollup.update({
              where: {
                user_id_transaction_type_period_type_period_key: {
                  user_id: userId,
                  transaction_type: t.type,
                  period_type: period,
                  period_key: periodKey,
                },
              },
              data: {
                total_amount: { increment: -1 * amount },
                transactions_count: { increment: -1 },
              },
            });
          });
        }),
      );
    }

    // Aggregate wallet reversal.
    let bankDelta = 0;
    let incomeDelta = 0;
    let expenseDelta = 0;
    let savingDelta = 0;
    for (const t of activeTransactions) {
      const amount = Number(t.amount);
      if (t.type === "Income") {
        bankDelta -= amount;
        incomeDelta -= amount;
      } else if (t.type === "Expense") {
        bankDelta += amount;
        expenseDelta -= amount;
      } else if (t.type === "Saving") {
        bankDelta += amount;
        savingDelta -= amount;
      }
    }

    let updatedWallet = null;
    if (activeTransactions.length > 0) {
      updatedWallet = await trx.wallet.update({
        where: { user_id: userId },
        data: {
          bank_balance: { increment: bankDelta },
          income: { increment: incomeDelta },
          expense: { increment: expenseDelta },
          saving: { increment: savingDelta },
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
    }

    // Null out tracker_id on every transaction that references this tracker
    // (both active and already-soft-deleted). This is required BEFORE hard-deleting
    // the tracker, otherwise the schema's onDelete: Cascade would purge the
    // soft-deleted transactions too, destroying history.
    // Active ones additionally get soft-deleted here.
    const now = new Date();
    await trx.transaction.updateMany({
      where: { tracker_id: id, user_id: userId, deleted_at: null },
      data: { tracker_id: null, deleted_at: now },
    });
    await trx.transaction.updateMany({
      where: { tracker_id: id, user_id: userId },
      data: { tracker_id: null },
    });

    // No transaction references the tracker anymore -> safe hard-delete.
    await trx.tracker.delete({ where: { id } });

    return {
      updatedWallet,
      deletedTransactionsCount: activeTransactions.length,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id,
        deletedTransactionsCount: result.deletedTransactionsCount,
        updatedWallet: result.updatedWallet
          ? serializeWallet(result.updatedWallet)
          : null,
      },
      "Tracker deleted successfully",
    ),
  );
});

export {
  createTracker,
  getTrackers,
  searchTrackers,
  getTrackerById,
  deleteTracker,
};
