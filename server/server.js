import express from "express";
import * as path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fetch from "node-fetch"
import dotenv from "dotenv";

dotenv.config();

const oauth_config = {
  discovery_url: "https://accounts.google.com/.well-known/openid-configuration",
  client_id: process.env.CLIENT_ID,
  scope: "openid email profile",
};

const app = express();
app.use(bodyParser.urlencoded());
app.use(cookieParser(process.env.COOKIE_SECRET));

// functions
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Error fetching!! ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}
// get endpoint Profile , som sender fetchJSON mot "/api/login"
app.get("/api/login", async (req, res) => {
  const { access_token } = req.signedCookies;
  const discoveryDocument = await fetchJSON(oauth_config.discovery_url);
  const { userinfo_endpoint } = discoveryDocument;
  let userinfo = undefined;
  try{
    userinfo = await fetchJSON(userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  }catch(err){
    console.error({ err });
  }
  res.json({ userinfo, oauth_config }).status(200);
});

// post endpoint LoginCallback. lagrer cookie.
app.post("/api/login", (req, res) => {
  const { access_token } = req.body;
  res.cookie("access_token", access_token, { signed: true });
  res.sendStatus(200);
});

// endpoint handleLogout funksjonen
app.delete("/api/login", (req,res) =>{
  res.clearCookie("access_token");
  res.sendStatus(200);
})


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
