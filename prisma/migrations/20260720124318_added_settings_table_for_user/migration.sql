-- CreateEnum
CREATE TYPE "AppTheme" AS ENUM ('Light', 'Dark', 'System');

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "theme" "AppTheme" NOT NULL DEFAULT 'Dark',
    "is_negative_balance" BOOLEAN NOT NULL DEFAULT false,
    "is_cash_transactions" BOOLEAN NOT NULL DEFAULT false,
    "is_credit_transactions" BOOLEAN NOT NULL DEFAULT false,
    "is_goals" BOOLEAN NOT NULL DEFAULT false,
    "is_trackers" BOOLEAN NOT NULL DEFAULT false,
    "additional_attribute" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_user_id_key" ON "settings"("user_id");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
