## Deployment

I'm creating this file once in for all

Because while setting up this deployment I got frusted by back and forth errors.

So here the solution step which I need to flow if my serverless deployment is not working on vercel. (Atleast this worked on Aug 4, 2025)

## Steps

### 1. Create API Folder

Creating an API folder at root of your project is very important and inside this I'll have an `index.js` or `index.ts`.
This `index` file is entry point for vercel in my server.

I will import and export my express app here, which is build in `app.js` file

### 2. app.js File

The final commit which solved my problem is actually here.
Before I'm exporting app like `{ app }` which is not default export and by doing this vercel is not able to locate my `app.js` file. So Change the app export to default export `export default app`.

### 3. Public Folder

Vercel is trying to find the `public` or `dist` which is not present in my server initally that's why I created this by following a YouTube video.

### 4. Vercel Config

This `vercel.json` show the exact thing like any API must redirect to `/api` because my server is running from `api/index.js` file and make sure it is correct it's very important.
Because I changed `vercel.json` almost around 10-15 times.

Also one more thing here this is latest version of `vercel.json` file I took from there docs, in this we don't need `routes` & `builds` by including them it is giving error.

Adding a working json below for future references.

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

## If nothing works

If nothing works then start from scratch like deploy a bare minimum server on vercel

Put the below code in `api/index.js` file and deploy, atleast this should before moving forward.
If this is also not working then problem is something else either some config is missing or vercel changed something internally.

```js
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Basic route to mast chal rha h");
});

app.listen(5000, () => {
  console.log("Running superfast on 5000");
});

export default app;
```

## Reference I used to solve this

[Vercel-Docs](http://vercel.com/guides/using-express-with-vercel)
[YT-Video](https://www.youtube.com/watch?v=B-T69_VP2Ls)
