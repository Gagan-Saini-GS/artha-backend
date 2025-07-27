import { PrismaClient } from "@prisma/client";

let prisma;

try {
  prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });
  console.log("✅ Prisma Client initialized successfully.");
} catch (e) {
  console.error("❌ Error initializing Prisma Client:", e);
  process.exit(1);
}

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("🗄️  Database connected successfully on host");
  } catch (error) {
    console.error("❌ Prisma connection error:", error);
    process.exit(1);
  }
};

export { prisma };
export default connectDB;
