import { RollupPeriod, TransactionType } from "@prisma/client";
import { prisma } from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getStatistics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { period, type, start_date, end_date } = req.query;

  // Weekly -> aggregate from Daily rollups
  if (period === "Weekly") {
    const dailyRollups = await prisma.transactionRollup.findMany({
      where: {
        user_id: userId,
        transaction_type: type,
        period_type: RollupPeriod.Daily,
        period_start: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
      },

      orderBy: {
        period_start: "asc",
      },

      select: {
        period_start: true,
        total_amount: true,
      },
    });

    const weeklyMap = new Map();
    for (const rollup of dailyRollups) {
      const date = new Date(rollup.period_start);

      // Monday of the week
      const weekStart = new Date(date);
      const day = weekStart.getUTCDay();

      // Sunday=0 -> treat as 7
      const diff = day === 0 ? -6 : 1 - day;

      weekStart.setUTCDate(weekStart.getUTCDate() + diff);

      const key = weekStart.toISOString().slice(0, 10);

      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, {
          period_key: key,
          period_type: "Weekly",
          transaction_type: type,
          total_amount: 0,
        });
      }

      weeklyMap.get(key).total_amount += Number(rollup.total_amount);
    }

    // Increamenting date by 1 to fetch transaction of last of range.
    const endDate = new Date(end_date);
    endDate.setDate(endDate.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: userId,
        type: type,
        date: {
          gte: new Date(start_date),
          lte: endDate,
        },
        deleted_at: null,
      },
      take: 15,
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        amount: true,
        type: true,
        date: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: Array.from(weeklyMap.values()),
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    });
  } else {
    const data = await prisma.transactionRollup.findMany({
      where: {
        user_id: userId,
        transaction_type: type,
        period_type: period,
        period_start: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
      },

      orderBy: {
        period_start: "asc",
      },

      select: {
        total_amount: true,
        transaction_type: true,
        period_key: true,
        period_type: true,
      },
    });

    // Increamenting date by 1 to fetch transaction of last of range.
    const endDate = new Date(end_date);
    endDate.setDate(endDate.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: userId,
        type: type,
        date: {
          gte: new Date(start_date),
          lte: endDate,
        },
        deleted_at: null,
      },
      take: 15,
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        amount: true,
        type: true,
        date: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: data.map((item) => ({
        ...item,
        total_amount: Number(item.total_amount),
      })),
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    });
  }

  return res.status(400).json({
    success: false,
    message: "Invalid period",
  });
});

const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { start_date, end_date } = req.query;

  const summary = await prisma.transactionRollup.groupBy({
    by: ["transaction_type"],

    where: {
      user_id: userId,
      period_type: RollupPeriod.Daily,

      period_start: {
        gte: new Date(start_date),
        lte: new Date(end_date),
      },
    },

    _sum: {
      total_amount: true,
    },
  });

  const result = {
    income: 0,
    expense: 0,
    saving: 0,
    withdraw: 0,
  };

  for (const item of summary) {
    const amount = Number(item._sum.total_amount ?? 0);

    switch (item.transaction_type) {
      case TransactionType.Income:
        result.income = amount;
        break;

      case TransactionType.Expense:
        result.expense = amount;
        break;

      case TransactionType.Saving:
        result.saving = amount;
        break;

      case TransactionType.Withdraw:
        result.withdraw = amount;
        break;
    }
  }

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const rebuildTransactionRollups = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.transactionRollup.deleteMany({
    where: {
      user_id: userId,
    },
  });

  // fillTransactionRollups -> This is a function from script

  await fillTransactionRollups(userId, RollupPeriod.Daily);

  await fillTransactionRollups(userId, RollupPeriod.Monthly);

  await fillTransactionRollups(userId, RollupPeriod.Yearly);

  return res.status(200).json({
    success: true,
    message: "Transaction rollups rebuilt.",
  });
});

export { getStatistics, getSummary, rebuildTransactionRollups };
