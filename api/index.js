import app from "../src/app.js";
export default app;

// import express from "express";
// const app = express();

// app.get("/", (req, res) => {
//   res.send("Chal ja bhai mere");
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// export default app;

// import serverlessHttp from "serverless-http";
// import connectDB from "../src/db/index.js";
// import { app } from "../src/app.js";

// let isConnected;

// async function bootstrap() {
//   if (!isConnected) {
//     await connectDB();
//     isConnected = true;
//   }
//   return app;
// }

// const handler = async (event, context) => {
//   console.log("🚀 Handler called with event:", {
//     path: event.path,
//     method: event.httpMethod,
//     headers: event.headers,
//   });

//   const appInstance = await bootstrap();
//   const handlerFn = serverlessHttp(appInstance);
//   return handlerFn(event, context);
// };

// // Export for Vercel
// export default handler;
