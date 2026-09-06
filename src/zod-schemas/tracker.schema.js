import { z } from "zod";

export const createTrackerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    budget_amount: z.number().positive("Budget amount must be positive"),
    current_amount: z
      .number()
      .nonnegative("Current amount cannot be negative")
      .optional(),
    description: z.string().optional(),
  }),
});

export const trackerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid tracker ID"),
  }),
});
