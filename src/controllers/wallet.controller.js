import { PaymentMethod, TransactionType } from "@prisma/client";
import { prisma } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getWalletDetailsByUserId = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const wallet = await prisma.wallet.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      bank_balance: true,
      expense: true,
      income: true,
      saving: true,
      // cash_balance: true,
      // credit_due: true,
      user_id: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, {
      ...wallet,
      bank_balance: Number(wallet.bank_balance),
      expense: Number(wallet.expense),
      income: Number(wallet.income),
      saving: Number(wallet.saving),
    }),
  );
});

// Case 1: Update Bank Balance if payment_method = Bank -> +amount (if type Income) and -amount (if expense or saving)
// Case 2: Update Cash Balance if payment_method = Cash -> +amount (if type Income) and -amount (if expense or saving)
// Case 3: Update Credit Due if payment_method = Credit -> +amount (only for expense)

/**
 * EXPENSE CASES
 * 1. Bank expense   -> decrease bank balance
 * 2. Cash expense   -> decrease cash balance
 * 3. Credit expense -> increase credit due
 *
 * INCOME CASES
 * 1. Bank income   -> increase bank balance
 * 2. Cash income   -> increase cash balance
 * 3. Credit income -> decrease credit due (⭐)
 *
 * SAVING CASES
 * 1. Bank saving   -> decrease bank balance
 * 2. Cash saving   -> decrease cash balance
 * 3. Credit saving -> NOT ALLOWED
 *
 *
 *
 *
 */
const updateWalletDetailsByUserId = asyncHandler(
  async (trx, amount, type, userId) => {
    const deltaAmount = type == "Income" ? amount : -1 * amount;

    const updatedWallet = await trx.wallet.update({
      where: {
        userId: userId,
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

    return updatedWallet;
  },
);

export { getWalletDetailsByUserId, updateWalletDetailsByUserId };
