const { ProductExpires, Products } = require("../../../models");
const { Op } = require("sequelize");
const cron = require("node-cron");

// ─── Config ───────────────────────────────────────────────────────────────────

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Attributes to include when joining Products
const PRODUCT_ATTRIBUTES = ["id", "name", "price", "qty"];

// Default include for all queries
const productInclude = [
  {
    model: Products,
    as: "product",
    attributes: PRODUCT_ATTRIBUTES,
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Send a Markdown message to Telegram via Bot API.
 * Throws if Telegram returns an error.
 */
const sendTelegramMessage = async (message) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data;
};

/**
 * Validate that Telegram credentials are configured.
 * Returns an error message string, or null if OK.
 */
const validateTelegramConfig = () => {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "your_bot_token_here") {
    return "Telegram Bot Token is not configured. Please set TELEGRAM_BOT_TOKEN in .env";
  }
  if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === "your_chat_id_here") {
    return "Telegram Chat ID is not configured. Please set TELEGRAM_CHAT_ID in .env";
  }
  return null;
};

/**
 * Format a Date object to YYYY-MM-DD string.
 */
const formatDate = (date) => new Date(date).toISOString().split("T")[0];

/**
 * Calculate days remaining until expiry (negative = already expired).
 */
const getDaysRemaining = (expiryDate) => {
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Parse and clamp pagination query params.
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Build a standard paginated success response body.
 */
const paginatedResponse = ({ message, rows, count, page, limit }) => {
  const totalPages = Math.ceil(count / limit);
  return {
    success: true,
    message,
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// ─── CRUD Controllers ──────────────────────────────────────────────────────────

/**
 * GET /product-expires
 * List all records with optional ?search=batchNumber and pagination.
 */
const getProductExpires = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const { page, limit, offset } = parsePagination(req.query);

    const where = search ? { batchNumber: { [Op.like]: `%${search}%` } } : {};

    const { count, rows } = await ProductExpires.findAndCountAll({
      where,
      include: productInclude,
      limit,
      offset,
      order: [["expiryDate", "ASC"]],
      distinct: true,
    });

    res.json(
      paginatedResponse({
        message: search
          ? "Product expiry records searched successfully"
          : "Product expiry records retrieved successfully",
        rows,
        count,
        page,
        limit,
      }),
    );
  } catch (error) {
    console.error("getProductExpires:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching product expiry records",
    });
  }
};

/**
 * GET /product-expires/:id
 * Get a single record by primary key.
 */
const getProductExpireById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ProductExpires.findByPk(id, {
      include: {
        model: Products,
        attributes: ["name", "id"],
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Product expiry record with ID ${id} not found`,
      });
    }

    res.json({
      success: true,
      message: "Product expiry record retrieved successfully",
      data: record,
    });
  } catch (error) {
    console.error("getProductExpireById:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching product expiry record",
    });
  }
};

/**
 * GET /product-expires/expiring-soon
 * Get products expiring within ?days=30 (default), with pagination.
 */
const getExpiringSoon = async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const { page, limit, offset } = parsePagination(req.query);

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const { count, rows } = await ProductExpires.findAndCountAll({
      where: { expiryDate: { [Op.between]: [now, futureDate] } },
      include: productInclude,
      order: [["expiryDate", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    res.json(
      paginatedResponse({
        message: `Products expiring within ${days} days retrieved successfully`,
        rows,
        count,
        page,
        limit,
      }),
    );
  } catch (error) {
    console.error("getExpiringSoon:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching expiring products",
    });
  }
};

/**
 * POST /product-expires
 * Create a new product expiry record.
 * Body: { productId, expiryDate, batchNumber?, isNotified? }
 */
const createProductExpire = async (req, res) => {
  try {
    const { productId, expiryDate, batchNumber, isNotified = false } = req.body;

    if (!productId || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Fields productId and expiryDate are required",
      });
    }

    const product = await Products.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
      });
    }

    const newRecord = await ProductExpires.create({
      productId,
      expiryDate,
      batchNumber,
      isNotified,
    });

    res.status(201).json({
      success: true,
      message: "Product expiry record created successfully",
      data: newRecord,
    });
  } catch (error) {
    console.error("createProductExpire:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating product expiry record",
    });
  }
};

/**
 * PUT /product-expires/:id
 * Partial update — only provided fields are changed.
 * Body: { productId?, expiryDate?, batchNumber?, isNotified? }
 */
const updateProductExpire = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, expiryDate, batchNumber, isNotified } = req.body || {};

    const hasUpdate = [productId, expiryDate, batchNumber, isNotified].some(
      (v) => v !== undefined,
    );

    if (!hasUpdate) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (productId, expiryDate, batchNumber, isNotified) is required to update",
      });
    }

    const record = await ProductExpires.findByPk(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Product expiry record with ID ${id} not found`,
      });
    }

    // If productId is changing, verify the new product exists
    if (productId !== undefined && productId !== record.productId) {
      const product = await Products.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`,
        });
      }
    }

    const updateData = {};
    if (productId !== undefined) updateData.productId = productId;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
    if (isNotified !== undefined) updateData.isNotified = isNotified;

    const updatedRecord = await record.update(updateData);

    res.json({
      success: true,
      message: "Product expiry record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("updateProductExpire:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating product expiry record",
    });
  }
};

/**
 * DELETE /product-expires/:id
 * Remove a record by ID.
 */
const deleteProductExpire = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ProductExpires.findByPk(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Product expiry record with ID ${id} not found`,
      });
    }

    await record.destroy();

    res.json({
      success: true,
      message: `Product expiry record with ID ${id} deleted successfully`,
    });
  } catch (error) {
    console.error("deleteProductExpire:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting product expiry record",
    });
  }
};

// ─── Telegram Notification ─────────────────────────────────────────────────────

/**
 * Build the Telegram message body from expired and expiring-soon records.
 */
const buildNotificationMessage = (now, expiredRecords, expiringRecords) => {
  let msg = `🚨 *ការជូនដំណឹងពីទំនិញផុតកំណត់*\n`;
  msg += `📅 ពិនិត្យនៅថ្ងៃទី: ${formatDate(now)}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (expiredRecords.length > 0) {
    msg += `❌ *ទំនិញដែលផុតកំណត់ហើយ (${expiredRecords.length}):*\n\n`;
    expiredRecords.forEach((record, i) => {
      const name = record.product?.name || "មិនស្គាល់ឈ្មោះទំនិញ";
      const daysAgo = Math.abs(getDaysRemaining(record.expiryDate));
      msg += `${i + 1}. *${name}*\n`;
      msg += `   📦 លេខបាច់: \`${record.batchNumber || "គ្មាន"}\`\n`;
      msg += `   📅 ផុតកំណត់កាលពី: ${formatDate(record.expiryDate)} (${daysAgo} ថ្ងៃមុន)\n\n`;
    });
  }

  if (expiringRecords.length > 0) {
    msg += `⚠️ *ទំនិញជិតផុតកំណត់ (${expiringRecords.length}):*\n\n`;
    expiringRecords.forEach((record, i) => {
      const name = record.product?.name || "មិនស្គាល់ឈ្មោះទំនិញ";
      const daysLeft = getDaysRemaining(record.expiryDate);
      const urgency = daysLeft <= 3 ? "🔴" : daysLeft <= 7 ? "🟡" : "🟢";
      msg += `${i + 1}. *${name}* ${urgency}\n`;
      msg += `   📦 លេខបាច់: \`${record.batchNumber || "គ្មាន"}\`\n`;
      msg += `   📅 នឹងផុតកំណត់នៅ: ${formatDate(record.expiryDate)} (នៅសល់ ${daysLeft} ថ្ងៃ)\n\n`;
    });
  }

  const total = expiredRecords.length + expiringRecords.length;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📊 សរុប: ទំនិញចំនួន ${total} មុខដែលត្រូវយកចិត្តទុកដាក់`;

  return msg;
};

/**
 * POST /product-expires/check-and-notify
 * Find products expiring within ?days=7 and already expired,
 * then send a Telegram alert.
 *
 * NOTE: isNotified filter is intentionally disabled to allow
 * repeat notifications on every manual trigger.
 * Re-enable and uncomment the update block if you want one-time notifications.
 */
const checkAndNotifyExpiring = async (req, res) => {
  try {
    const configError = validateTelegramConfig();
    if (configError) {
      return res.status(500).json({ success: false, message: configError });
    }

    const days = Math.max(1, parseInt(req.query.days) || 7);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const [expiredRecords, expiringRecords] = await Promise.all([
      ProductExpires.findAll({
        where: { expiryDate: { [Op.lt]: now } },
        include: productInclude,
        order: [["expiryDate", "ASC"]],
      }),
      ProductExpires.findAll({
        where: { expiryDate: { [Op.between]: [now, futureDate] } },
        include: productInclude,
        order: [["expiryDate", "ASC"]],
      }),
    ]);

    const total = expiredRecords.length + expiringRecords.length;

    if (total === 0) {
      return res.json({
        success: true,
        message: "No expiring products require notification",
        notifiedCount: 0,
      });
    }

    const message = buildNotificationMessage(
      now,
      expiredRecords,
      expiringRecords,
    );
    await sendTelegramMessage(message);

    // Uncomment to mark as notified after sending (one-time notification mode):
    // const ids = [...expiredRecords, ...expiringRecords].map((r) => r.id);
    // await ProductExpires.update({ isNotified: true }, { where: { id: { [Op.in]: ids } } });

    res.json({
      success: true,
      message: `Telegram notification sent for ${total} product(s)`,
      notifiedCount: total,
      data: {
        expiredCount: expiredRecords.length,
        expiringSoonCount: expiringRecords.length,
      },
    });
  } catch (error) {
    console.error("checkAndNotifyExpiring:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while sending expiry notifications",
      error: error.message,
    });
  }
};

// ─── Auto Scheduler ────────────────────────────────────────────────────────────

/**
 * Start a cron job that automatically checks and sends Telegram notifications
 * every day at 07:00 AM (Asia/Phnom_Penh).
 *
 * Call from app.js:
 *   const { startExpiryNotificationCron } = require("./Controller/productExpireController");
 *   startExpiryNotificationCron();
 */
const startExpiryNotificationCron = () => {
  console.log(
    "⏰ Expiry notification scheduler started (runs at 07:00 AM daily)",
  );

  const runCheck = async () => {
    try {
      const configError = validateTelegramConfig();
      if (configError) {
        console.log(`⚠️  Skipping expiry check: ${configError}`);
        return;
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + 7);

      const records = await ProductExpires.findAll({
        where: { expiryDate: { [Op.lte]: futureDate } },
        include: productInclude,
        order: [["expiryDate", "ASC"]],
      });

      if (records.length === 0) {
        console.log("✅ No expiring products to notify");
        return;
      }

      const expired = records.filter((r) => new Date(r.expiryDate) < now);
      const expiringSoon = records.filter((r) => new Date(r.expiryDate) >= now);

      const message = buildNotificationMessage(now, expired, expiringSoon);
      await sendTelegramMessage(message);

      // Uncomment to mark as notified (one-time notification mode):
      // const ids = records.map((r) => r.id);
      // await ProductExpires.update({ isNotified: true }, { where: { id: { [Op.in]: ids } } });

      console.log(
        `📨 Telegram notification sent for ${records.length} expiring product(s)`,
      );
    } catch (error) {
      console.error("❌ Auto expiry check failed:", error.message);
    }
  };

  // Runs every day at 07:00 AM Asia/Phnom_Penh
  cron.schedule("0 7 * * *", runCheck, {
    scheduled: true,
    timezone: "Asia/Phnom_Penh",
  });
};

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getProductExpires,
  getProductExpireById,
  getExpiringSoon,
  createProductExpire,
  updateProductExpire,
  deleteProductExpire,
  checkAndNotifyExpiring,
  startExpiryNotificationCron,
};
