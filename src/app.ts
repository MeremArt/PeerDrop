import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database";

import withdrawalRoutes from "./routes/withdrawal.routes";
import transactionRoutes from "./routes/transactionRoutes";
import authRoutes from "./routes/auth.routes";
import passport from "passport";
import cors from "cors";
import session from "express-session";
import { configurePassport } from "./config/passport";

// import smsRoutes from "./routes/sms.routes";
import { specs, swaggerUi } from "./config/swagger";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
  })
);
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.options("*", cors(corsOptions));
app.use("*", cors(corsOptions));
configurePassport();

// Routes
// app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
// app.use("/api/sms", smsRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api/twitter", twitterRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "PeerToPair API Documentation",
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Cloutchain - Send Sonic via SMS $ Tiplinks! 🚀",
    description:
      "A simple and secure way to tip Sonic using phone numbers and tiplinks.",
    version: "1.0.0",
    documentation: {
      description: "Explore our API endpoints:",
      link: "https://documenter.getpostman.com/view/1234567/TzJx9n8A",
    },
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
