"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const withdrawal_routes_1 = __importDefault(require("./routes/withdrawal.routes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const passport_1 = __importDefault(require("passport"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const passport_2 = require("./config/passport");
// import smsRoutes from "./routes/sms.routes";
const swagger_1 = require("./config/swagger");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Connect to MongoDB
(0, database_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
}));
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
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.options("*", (0, cors_1.default)(corsOptions));
app.use("*", (0, cors_1.default)(corsOptions));
(0, passport_2.configurePassport)();
// Routes
// app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes_1.default);
// app.use("/api/sms", smsRoutes);
app.use("/api/auth", auth_routes_1.default);
// app.use("/api/twitter", twitterRoutes);
app.use("/api/withdrawals", withdrawal_routes_1.default);
app.use("/api-docs", swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "PeerToPair API Documentation",
}));
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to PeerToPair - Send USDC via SMS! 🚀",
        description: "A simple and secure way to send USDC using phone numbers.",
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
