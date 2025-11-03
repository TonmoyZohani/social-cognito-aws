const express = require("express");
const session = require("express-session");
const { Issuer, generators } = require("openid-client");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

let client;

// Initialize OpenID Client
async function initializeClient() {
  try {
    console.log("🔍 Discovering Cognito issuer...");
    const issuer = await Issuer.discover(
      `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`
    );

    client = new issuer.Client({
      client_id: process.env.COGNITO_CLIENT_ID,
      client_secret: process.env.COGNITO_CLIENT_SECRET,
      redirect_uris: [process.env.REDIRECT_URI],
      response_types: ["code"],
    });

    console.log("✅ OIDC Client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize OIDC client:", error);
  }
}

initializeClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "cognito-social-demo-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Set view engine
app.set("view engine", "ejs");

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userInfo) {
    return res.redirect("/login");
  }
  next();
};

const checkAuth = (req, res, next) => {
  req.isAuthenticated = !!req.session.userInfo;
  next();
};

// Routes

// Home page
app.get("/", checkAuth, (req, res) => {
  res.render("home", {
    isAuthenticated: req.isAuthenticated,
    userInfo: req.session.userInfo,
  });
});

// Dashboard (protected)
app.get("/dashboard", requireAuth, checkAuth, (req, res) => {
  res.render("dashboard", {
    userInfo: req.session.userInfo,
  });
});

// Login routes
app.get("/login", (req, res) => {
  res.render("login", { error: req.query.error });
});

app.get("/login/google", (req, res) => {
  const nonce = generators.nonce();
  const state = generators.state();

  req.session.nonce = nonce;
  req.session.state = state;

  const authUrl = client.authorizationUrl({
    // REMOVE scope parameter - let openid-client handle it
    state: state,
    nonce: nonce,
    identity_provider: "Google",
  });

  console.log("🔗 Google Login URL:", authUrl);
  res.redirect(authUrl);
});

// Callback handler
app.get("/auth/callback", async (req, res) => {
  try {
    if (!client) {
      return res.status(500).send("OIDC client not initialized");
    }

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(process.env.REDIRECT_URI, params, {
      nonce: req.session.nonce,
      state: req.session.state,
    });

    const userInfo = await client.userinfo(tokenSet.access_token);
    req.session.userInfo = userInfo;

    console.log("✅ User authenticated:", userInfo.email);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("❌ Authentication error:", error);
    res.redirect("/login?error=auth_failed");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    const logoutUrl = `https://${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=http://localhost:3000`;
    res.redirect(logoutUrl);
  });
});

// API Routes (for testing)

// Get user info API
app.get("/api/user", checkAuth, (req, res) => {
  if (!req.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ user: req.session.userInfo });
});

// Get social URLs API
app.get("/api/auth/urls", (req, res) => {
  const nonce = generators.nonce();
  const state = generators.state();

  req.session.nonce = nonce;
  req.session.state = state;

  const googleUrl = client.authorizationUrl({
    scope: "email openid profile",
    state: state,
    nonce: nonce,
    identity_provider: "Google",
  });

  const facebookUrl = client.authorizationUrl({
    scope: "email openid profile",
    state: state,
    nonce: nonce,
    identity_provider: "Facebook",
  });

  res.json({
    google: googleUrl,
    facebook: facebookUrl,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    endpoints: {
      home: "GET /",
      login: "GET /login",
      dashboard: "GET /dashboard",
      api_user: "GET /api/user",
      api_urls: "GET /api/auth/urls",
      health: "GET /health",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🏠 Home: http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
});
