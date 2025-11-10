import { Router } from "express";
import { generators } from "openid-client";
import { getClient } from "../config/cognitoClient";
import { AuthRequest } from "../types/express";
import axios from "axios";

const router = Router();

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

  console.log("Google Login URL:", authUrl);
  res.redirect(authUrl);
});

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

    console.log("User authenticated:", userInfo.email);
    console.log("User Info", userInfo);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Authentication error:", error);
    res.redirect("/login?error=auth_failed");
  }
});

// LinkedIn Social Login routes
router.get("/linkedin", (req, res) => {
  const authReq = req as AuthRequest;
  const state = generators.state();
  const nonce = generators.nonce();

  authReq.session.linkedinState = state;
  authReq.session.linkedinNonce = nonce;

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_CALLBACK_URL;
  const scope = encodeURIComponent("openid profile email");

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri!
  )}&state=${state}&scope=${scope}`;

  console.log("LinkedIn Login URL:", linkedinAuthUrl);
  res.redirect(linkedinAuthUrl);
});

router.get("/linkedin/callback", async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { code, state } = req.query;

    if (!code) {
      throw new Error("Authorization code not provided");
    }

    if (state !== authReq.session.linkedinState) {
      throw new Error("Invalid state parameter");
    }

    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL!,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const linkedinUser = profileResponse.data;

    const userInfo = {
      sub: linkedinUser.sub,
      email: linkedinUser.email,
      name: linkedinUser.name,
      given_name: linkedinUser.given_name,
      family_name: linkedinUser.family_name,
      picture: linkedinUser.picture,
      email_verified: true, 
      provider: "linkedin",
    };

    authReq.session.userInfo = userInfo;
    authReq.session.isAuthenticated = true;

    console.log("LinkedIn User authenticated:", userInfo.email);
    console.log("LinkedIn User Info", userInfo);

    res.redirect("/dashboard");
  } catch (error) {
    console.error("LinkedIn Authentication error:", error);
    res.redirect("/login?error=linkedin_auth_failed");
  }
});


router.get("/logout", (req, res) => {
  const authReq = req as AuthRequest;

  authReq.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }
    res.redirect("/");
  });
});

export default router;
