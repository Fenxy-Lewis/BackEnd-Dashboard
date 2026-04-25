const express = require("express");
const router = express.Router();
const imageFileUpload = require("./fileUpload");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("./Controller/productController");

// GET    /api/v1/products         → get all or search by ?search=name
// GET    /api/v1/products/:id     → get single product by ID
// POST   /api/v1/products         → create new product
// PUT    /api/v1/products/:id     → update product by ID
// DELETE /api/v1/products/:id     → delete product by ID

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.use("/", imageFileUpload); // must be before /:id delete to avoid route conflict

module.exports = router;
