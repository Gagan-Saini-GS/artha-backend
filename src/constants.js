import { RollupPeriod } from "@prisma/client";

export const DB_NAME = "artha";

// Default JWT expiry values (can be overridden by .env)
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export const periodConfig = {
  [RollupPeriod.Daily]: {
    groupBy: "DATE(date)",

    generateKey: (d) => {
      return d.toISOString().slice(0, 10);
    },

    getPeriodStart: (d) => {
      return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
      );
    },
  },

  [RollupPeriod.Monthly]: {
    groupBy: "DATE_TRUNC('month', date)",

    generateKey: (d) => {
      return d.toISOString().slice(0, 7);
    },

    getPeriodStart: (d) => {
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    },
  },

  [RollupPeriod.Yearly]: {
    groupBy: "DATE_TRUNC('year', date)",

    generateKey: (d) => {
      return d.getUTCFullYear().toString();
    },

    getPeriodStart: (d) => {
      return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    },
  },
};
