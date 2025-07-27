import { Router } from "express";
import {
  createTransaction,
  getRecentTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionHistory,
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/zod.middleware.js";
import { createTransactionSchema } from "../zod-schemas/transaction.schema.js";

const router = Router();

// Secure all transaction routes
router.use(verifyJWT);

/**
 * @swagger
 * tags:
 * name: Transactions
 * description: Transaction management
 */

/**
 * @swagger
 * /api/v1/transactions:
 * post:
 * summary: Create a new transaction
 * tags: [Transactions]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Transaction'
 * responses:
 * 201:
 * description: Transaction created successfully
 */
router.post("/", validate(createTransactionSchema), createTransaction);

/**
 * @swagger
 * /api/v1/transactions/recent:
 * get:
 * summary: Get the 5 most recent transactions
 * tags: [Transactions]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of recent transactions
 */
router.get("/recent", getRecentTransactions);

/**
 * @swagger
 * /api/v1/transactions/history:
 * get:
 * summary: Get paginated transaction history
 * tags: [Transactions]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * description: The page number for pagination
 * responses:
 * 200:
 * description: A paginated list of all transactions
 */
router.get("/history", getTransactionHistory);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 * get:
 * summary: Get a single transaction by ID
 * tags: [Transactions]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The transaction ID
 * responses:
 * 200:
 * description: Transaction details
 * 404:
 * description: Transaction not found
 */
router.get("/:id", getTransactionById);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 * delete:
 * summary: Delete a transaction (soft delete)
 * tags: [Transactions]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The transaction ID
 * responses:
 * 200:
 * description: Transaction deleted successfully
 * 404:
 * description: Transaction not found
 */
router.delete("/:id", deleteTransaction);

export default router;

/**
 * @swagger
 * components:
 * schemas:
 * Transaction:
 * type: object
 * required:
 * - title
 * - type
 * - amount
 * - date
 * properties:
 * id:
 * type: string
 * description: The auto-generated id of the transaction
 * title:
 * type: string
 * description: The title of the transaction
 * type:
 * type: string
 * enum: [Expense, Income, Saving]
 * description: The type of transaction
 * amount:
 * type: number
 * format: float
 * description: The transaction amount
 * date:
 * type: string
 * format: date
 * description: The date of the transaction
 * note:
 * type: string
 * description: An optional note for the transaction
 */
