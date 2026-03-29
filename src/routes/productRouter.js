const express = require("express");
const router = express.Router();
const imageFileUpload = require("./fileUpload")
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("./Controller/productController");

// GET    /api/v1/products         → get all or search by ?search=name
// POST   /api/v1/products         → create new product
// PUT    /api/v1/products/:id     → update product by ID
// DELETE /api/v1/products/:id     → delete product by ID

router.get("/", getProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.use("/", imageFileUpload);


module.exports = router;