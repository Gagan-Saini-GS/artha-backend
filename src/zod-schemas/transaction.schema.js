import { z } from "zod";

export const createTransactionSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["Expense", "Income", "Saving"]),
    amount: z.number().positive("Amount must be positive"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    note: z.string().optional(),
  }),
});

export const deleteTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid transaction ID"),
  }),
  body: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  }),
});
