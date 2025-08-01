import serverlessHttp from "serverless-http";
import dotenv from "dotenv";
import connectDB from "../src/db/index.js";
import { app } from "../src/app.js";

dotenv.config();

let isConnected;

async function bootstrap() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app;
}

export const handler = async (event, context) => {
  const appInstance = await bootstrap();
  const handlerFn = serverlessHttp(appInstance);
  return handlerFn(event, context);
};
