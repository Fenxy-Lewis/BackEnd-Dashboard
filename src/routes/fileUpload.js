const app = require("express");
const router = app.Router();
const path = require("path");
const fs = require("fs");
const { storage } = require("../storage/storage");
const multer = require("multer");
const upload = multer({ storage });
const { Products, ProductImage } = require("../../models");

// Image Upload Route
router.post("/:id/upload", upload.single("file"), async (req, res) => {
  try {
    const { file } = req;
    const productId = req.params.id;
    const product = await Products.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.log(file);
    const savedImageUrl = await ProductImage.create({
      productId,
      fileName: file.originalname,
      imageUrl: file.path,
    });
    res.status(200).json({
      message: "Image uploaded successfully",
      data: savedImageUrl,
    });
  } catch (error) {
    console.error("Error in /upload:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Image link download route (API)
router.get("/images/:imageId/download", async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await ProductImage.findByPk(imageId);
    if (!image) {
      return res
        .status(404)
        .json({ message: `Image with id ${imageId} not found` });
    }
    const fileName = image.imageUrl.split("/").pop();
    const imagePath = path.join(process.cwd(), "uploads/products", fileName);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        message: "Image file not found on server",
      });
    }
    res.download(imagePath, image.fileName);
  } catch (error) {
    console.error("Error in /:id/images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Delete ProductImage (API)
router.delete("/delete/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await ProductImage.findOne({
      where: {
        id: imageId,
      },
    });
    if (!image) {
      return res
        .status(404)
        .json({ message: `Image with id ${imageId} not found` });
    }
    const fileName = image.imageUrl.split("/").pop();
    const imagePath = path.join(process.cwd(), "uploads/products", fileName);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        message: "Image file not found on server",
      });
    }
    fs.unlinkSync(imagePath);
    await image.destroy();
    res.status(200).json({
      message: `ImageId ${imageId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error in /:id/delete:", error);
    res.status(500).json({ message: "Fuck You..! Internal server error" });
  }
});

module.exports = router;
