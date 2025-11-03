import { Router } from "express";
import { generators } from "openid-client";
import { getClient } from "../config/cognitoClient";
import { AuthRequest } from "../types/express";

const router = Router();

// ADD THIS ROUTE - handles /auth/login/google
router.get("/login/google", (req, res) => {
  const authReq = req as AuthRequest;
  const nonce = generators.nonce();
  const state = generators.state();

  authReq.session.nonce = nonce;
  authReq.session.state = state;

  const client = getClient();
  const authUrl = client.authorizationUrl({
    state: state,
    nonce: nonce,
    identity_provider: "Google",
  });

  console.log("🔗 Google Login URL:", authUrl);
  res.redirect(authUrl);
});

// Google Login (alternative path)
router.get("/google", (req, res) => {
  const authReq = req as AuthRequest;
  const nonce = generators.nonce();
  const state = generators.state();

  authReq.session.nonce = nonce;
  authReq.session.state = state;

  const client = getClient();
  const authUrl = client.authorizationUrl({
    state: state,
    nonce: nonce,
    identity_provider: "Google",
  });

  console.log("🔗 Google Login URL:", authUrl);
  res.redirect(authUrl);
});

// Callback handler
router.get("/callback", async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const client = getClient();

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(process.env.REDIRECT_URI!, params, {
      nonce: authReq.session.nonce,
      state: authReq.session.state,
    });

    const userInfo = await client.userinfo(tokenSet.access_token!);
    authReq.session.userInfo = userInfo;

    console.log("✅ User authenticated:", userInfo.email);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("❌ Authentication error:", error);
    res.redirect("/login?error=auth_failed");
  }
});

export default router;