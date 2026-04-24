require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const db = require("./models");
const requestLogger = require("./requestLogger");
// ─── Routers ─────────────────────────────────────────────────────────────────
const authRouter = require("./src/routes/auth");
const paymentRoute = require("./src/routes/paymentRouter");
const productRouter = require("./src/routes/productRouter");
const categoryRouter = require("./src/routes/categoryRouter");
const customerRouter = require("./src/routes/customerRouter");
const orderRouter = require("./src/routes/orderRouter");
const productExpireRouter = require("./src/routes/productExpireRouter");
const authMiddleware = require("./src/middlewares/authMiddleware");

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(requestLogger);
app.use(express.json());
// ─── Database Connection ──────────────────────────────────────────────────────
db.sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((e) => console.error("❌ Unable to connect to the database:", e));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/product-expires", productExpireRouter);
app.use("/api/v1/payments", paymentRoute);
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);

  // Start the expiry notification cron job (runs daily at 7:00 AM)
  const {
    startExpiryNotificationCron,
  } = require("./src/routes/Controller/productExpireController");
  startExpiryNotificationCron();
});
