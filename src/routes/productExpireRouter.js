const express = require("express");
const router = express.Router();
const {
  getProductExpires,
  getProductExpireById,
  getExpiringSoon,
  createProductExpire,
  updateProductExpire,
  deleteProductExpire,
  checkAndNotifyExpiring,
} = require("./Controller/productExpireController");

// GET    /api/v1/product-expires              → get all or search by ?search=batchNumber
// GET    /api/v1/product-expires/expiring-soon → get products expiring within ?days=30
// GET    /api/v1/product-expires/:id           → get single record by ID
// POST   /api/v1/product-expires               → create new product expiry record
// PUT    /api/v1/product-expires/:id           → update record by ID
// DELETE /api/v1/product-expires/:id           → delete record by ID

router.get("/", getProductExpires);
router.get("/expiring-soon", getExpiringSoon);
router.get("/:id", getProductExpireById);
router.post("/", createProductExpire);
router.post("/check-and-notify", checkAndNotifyExpiring);
router.put("/:id", updateProductExpire);
router.delete("/:id", deleteProductExpire);

module.exports = router;
