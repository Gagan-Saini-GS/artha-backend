// import serverlessHttp from "serverless-http";
// import dotenv from "dotenv";
// import connectDB from "../src/db/index.js";
// import { app } from "../src/app.js";

// dotenv.config();

// let isConnected;

// async function bootstrap() {
//   if (!isConnected) {
//     await connectDB();
//     isConnected = true;
//   }
//   return app;
// }

// export const handler = async (event, context) => {
//   const appInstance = await bootstrap();
//   const handlerFn = serverlessHttp(appInstance);
//   return handlerFn(event, context);
// };

import serverlessHttp from "serverless-http";
import connectDB from "../src/db/index.js";
import { app } from "../src/app.js";

let isConnected;

async function bootstrap() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app;
}

const handler = async (event, context) => {
  console.log("🚀 Handler called with event:", {
    path: event.path,
    method: event.httpMethod,
    headers: event.headers,
  });

  const appInstance = await bootstrap();
  const handlerFn = serverlessHttp(appInstance);
  return handlerFn(event, context);
};

// Export for Vercel
export default handler;
