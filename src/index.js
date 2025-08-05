// This is for local only, vercel will not run this.
import app from "./app.js";

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`✅ Local server running at http://localhost:${port}`);
});
