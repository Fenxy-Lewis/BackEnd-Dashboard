const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { storage } = require("../storage/storage");
const multer = require("multer");
const upload = multer({ storage });
const { cloudinary } = require("../storage/storage");
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
      publicId: file.filename,
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
    // ពិនិត្យថា imageId ជាលេខត្រឹមត្រូវ
    if (!imageId || isNaN(imageId)) {
      return res.status(400).json({ message: "Invalid image ID" });
    }

    const image = await ProductImage.findOne({
      where: { id: imageId },
    });

    // បើមិនរករកឃើញ record
    if (!image) {
      return res.status(404).json({
        message: `Product Image ID ${imageId} not found`,
      });
    }

    if (image.publicId) {
      console.log(image.publicId);
      const cloudinaryResult = await cloudinary.uploader.destroy(
        image.publicId,
      );

      // ពិនិត្យថា Cloudinary លុបបានជោគជ័យ
      if (
        cloudinaryResult.result !== "ok" &&
        cloudinaryResult.result !== "not found"
      ) {
        return res.status(500).json({
          message: "Cannot delete image from Cloudinary",
        });
      }
    }

    // លុប record ពី Database
    await image.destroy();

    res.status(200).json({
      success: true,
      message: `Product Image ID ${imageId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
