import express from "express";
import * as path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fetch from "node-fetch"
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// functions
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Failed ${res.status}`);
  }
  return await res.json();
}
// endpoint Profile , sender fetchJSON mot "/api/login"
app.get("/api/login", async (req, res) => {
  const { access_token } = req.signedCookies;
  const { userinfo_endpoint } = await fetchJSON(
    "https://accounts.google.com/.well-known/openid-configuration"
  );
  const userinfo = await fetchJSON(userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  res.json(userinfo);
});

// endpoint LoginCallback
app.post("/api/login", (req, res) => {
  const { access_token } = req.body;
  res.cookie("access_token", access_token, { signed: true });
  res.sendStatus(200);
});

// endpoint reactappen
app.use(express.static("../client/dist"));

//endpoint for react browserrouter  * GET ! /api
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.resolve("../client/dist/index.html"));
  } else {
    next();
  }
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Started on http://localhost:${server.address().port}`);
});
